import * as cdk from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as fs from 'fs';
import { Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

// VPC - SG - ROLE - EC2 - S3 - ALB - 오토스케일링 그룹 - Secret Manager - RDB 
export class CdkAnabada extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // VPC
    const vpc = this.build_VPC('anabada-prod')!;

    // SG
    // web server ec2
    const sgWasServer = new ec2.SecurityGroup(this, 'sgWasServer', {
      vpc,
      description: 'was-server security group',
      allowAllOutbound: true
    });
    sgWasServer.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), 'Allow 8080 Access')
    sgWasServer.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH Access')

    // bastion sg
    const sgBastionHost = new ec2.SecurityGroup(this, 'sgBastionHost', {
      vpc,
      description: 'bastion-host security group',
      allowAllOutbound: true
    });
    sgBastionHost.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow 8080 Access')
    sgBastionHost.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), 'Allow 8080 Access')
    sgBastionHost.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH Access')

    // ROLE
    const wasRole = new iam.Role(this, 'wasRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: 'anabada-ec2-codedeploy-role',
      description: 'ec2-was-server-role'
    })
    wasRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2RoleforAWSCodeDeploy'));

    const bastionRole = new iam.Role(this, 'bastionRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: 'anabada-ec2-bastion-role',
      description: 'ec2-bastion-role',
    });
    bastionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));

    // EC2
    // bastion ec2
    const bastionHost = new ec2.Instance(this, 'bastion-host', {
      vpc,
      role: bastionRole,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO,),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      securityGroup: sgBastionHost,
      vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC},
      keyName: 'anabada-all',
    });
    Tags.of(bastionHost).add('Name', 'bastion-host');

    const userDataScript = fs.readFileSync('./src/scripts/user-data.sh', 'utf8');
    bastionHost.addUserData(userDataScript);

    // ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, 'alb', {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener('Listener', {
      port: 80,
      open: true,
    });

    const ami = new ec2.GenericLinuxImage({'ap-northeast-2': 'ami-0e29e17e38df1d136',});
    // 오토스케일링 그룹
    const asg = new autoscaling.AutoScalingGroup(this, "asg", { 
      vpc,
      vpcSubnets: {subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,},
      securityGroup: sgWasServer,
      role: wasRole,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
      machineImage: ami,
      minCapacity: 2,
      maxCapacity: 3,
      keyName: 'anabada-all',
    });
    Tags.of(asg).add('Name', 'anabada');

    listener.addTargets("default-target", {
      port: 8080,
      targets: [asg],
      healthCheck: {
        path: "/",
        unhealthyThresholdCount: 2,
        healthyThresholdCount: 5,
        interval: cdk.Duration.seconds(30),
      },
    });

    // S3
    const s3Bucket = new s3.Bucket(this, 's3-bucket', {
      bucketName: 'anabada-project',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Secret Manager
    const secret = new secretsmanager.Secret(this, 'DBCredentialsSecret', {
      secretName: 'prod/blog-db/maria-2',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'kimsiho',
          password: 'ng1029~!'
        }),
        generateStringKey: 'ng1029~!',
      }
    });

    // RDB
    const rdsInstance = new rds.DatabaseInstance(this, "PostgresInstance", {
      engine: rds.DatabaseInstanceEngine.POSTGRES,
      credentials: rds.Credentials.fromSecret(secret),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      vpc,
      port: 3306,
      databaseName: 'anabadadb',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
    });

    rdsInstance.connections.allowFrom(asg, ec2.Port.tcp(3306))

    new cdk.CfnOutput(this, 'RDS Endpoint', { value: rdsInstance.dbInstanceEndpointAddress });
    new cdk.CfnOutput(this, 'bucketName', { value: s3Bucket.bucketName, });

  }

  // 가용 영역 설정
  get availabilityZones(): string[] {
    return ['ap-northeast-2a', 'ap-northeast-2c'];
  }

  // VPC 생성
  build_VPC(_id: string) {
    try {
      const vpc = new ec2.Vpc(this, _id, {
        cidr: "172.16.0.0/24",
        natGateways: 1,
        maxAzs: 2,
        vpcName: _id,
        subnetConfiguration: [
          {
            subnetType: ec2.SubnetType.PUBLIC,
            cidrMask: 27,
            name: 'public'
          },
          {
            subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
            cidrMask: 27,
            name: 'web-private'
          },
          {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            cidrMask: 27,
            name: 'db-private'
          },
        ]
      });
      return vpc;
    } catch (e) {
      console.log("ERROR in build_VPC ", _id, " > ", e);
      return null;
    }
  }
}

