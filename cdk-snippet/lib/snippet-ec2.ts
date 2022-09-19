import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import {readFileSync} from 'fs';

export class CdkEc2Basic extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 create VPC in which we'll launch the Instance
    const vpc = new ec2.Vpc(this, 'my-cdk-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
      subnetConfiguration: [
        { name: 'public', cidrMask: 24, subnetType: ec2.SubnetType.PUBLIC },
      ],
    });

    // 👇 create Security Group for the Instance
    const webserverSG = new ec2.SecurityGroup(this, 'webserver-sg', {
      vpc,
      allowAllOutbound: true,
    });

    webserverSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'allow SSH access from anywhere',
    );

    webserverSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'allow HTTP traffic from anywhere',
    );

    webserverSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'allow HTTPS traffic from anywhere',
    );

    // 👇 create a Role for the EC2 Instance
    const webserverRole = new iam.Role(this, 'webserver-role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
    });

    // 👇 create the EC2 Instance
    const ec2Instance = new ec2.Instance(this, 'ec2-instance', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      role: webserverRole,
      securityGroup: webserverSG,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      keyName: 'ec2-key-pair',
    });

    // 👇 load contents of script
    const userDataScript = readFileSync('./src/scripts/user-data.sh', 'utf8');

    // 👇 add the User Data script to the Instance
    ec2Instance.addUserData(userDataScript);
  }
}


export class CdkEc2SubnetSelect extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'my-cdk-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'isolated-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28,
        },
      ],
    });

    const securityGroup = new ec2.SecurityGroup(this, 'security-group-id', {
      vpc,
    });


    // 퍼블릭 subnet 타입 중 하나에 생성
    // const webServer = new ec2.Instance(this, 'web-server', {
    //   instanceType: ec2.InstanceType.of(
    //     ec2.InstanceClass.BURSTABLE2,
    //     ec2.InstanceSize.MICRO,
    //   ),
    //   machineImage: ec2.MachineImage.latestAmazonLinux(),
    //   vpc,
    //   securityGroup,
    //   // 👇 set the subnet type to PUBLIC
    //   vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC},
    // });


    // 서브넷 이름에 매칭되는 하나에 생성.. 하지만 이름이 다 같아서 그중 하나에 생성
    // const webServer = new ec2.Instance(this, 'web-server', {
    //   instanceType: ec2.InstanceType.of(
    //     ec2.InstanceClass.BURSTABLE2,
    //     ec2.InstanceSize.MICRO,
    //   ),
    //   machineImage: ec2.MachineImage.latestAmazonLinux(),
    //   vpc,
    //   securityGroup,
    //   // 👇 launch in subnet with a specific Group Name
    //   vpcSubnets: {subnetGroupName: 'public-subnet-1'},
    // })

    // az를 선택하는 것은 해당 스택에 환경이 명시되어 있어야 된다
    // az을 선택해서 해당 az에 생성. 즉 인스턴스 1개 생성
    const webServer = new ec2.Instance(this, 'web-server', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      vpc,
      securityGroup,
      // 👇 explicitly pick availability zones of the subnet
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
        availabilityZones: [cdk.Stack.of(this).availabilityZones[0]],
      },
    });

  }
}