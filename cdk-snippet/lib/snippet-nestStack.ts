import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';

// 같은 vpc 설정이 여러 군데에서 쓰이고 있으면 그것을 추출해서 별도의 스택으로 만드는 것이 타당하다, vpc 설정 수정이 필요하면 해당 스택을 수정후 부모 스택을 다시 재배포하기만 하면 된다
// cdk 는 클라우드 포매이션으로 컴파일되고 500개의 리소스가 하나의 스택으로 제약이 있다 중첩 스택은 1로 취급되므로 해당 제약을 회피할 수 있다

// vpc 리소스를 할당하고 그것을 클래스의 프로퍼티로 할당한다
// 중첩 스택은 별도의 클라우드 포매이션 템플릿을 가지고 별도의 스택으로 배포되지만 단독으로 배포될 수 없고 사용자는 root stack을 사용해서 nested stack을 이용하게 된다
// 👇 extends NestedStack
class VpcNestedStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.NestedStackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'nested-stack-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });
  }
}


// 중첩 vpc 스택을 이용하는 스택
// 중첩 스택을 수정하고 부모 스택을 재 배포할경우, 변경 사항이 반영된다
// 중첩 스택은 여러 번 사용할 수 있다
export class UsingNestStackStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 grab the VPC from the nested stack
    const { vpc } = new VpcNestedStack(this, 'nested-stack');

    const webserverSG = new ec2.SecurityGroup(this, 'webserver-sg', {
      vpc,
    });

    webserverSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'allow HTTP traffic from anywhere',
    );

    const ec2Instance = new ec2.Instance(this, 'ec2-instance', {
      // 👇 use the VPC from the nested stack
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: webserverSG,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
    });

    ec2Instance.addUserData(
      'sudo su',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>It works :)</h1>" > /var/www/html/index.html',
    );

    // 중첩 스택 중복해서 사용, 이렇게 하면 위에 배포한 중첩 스택까지 총 2개의 중첩 스택이 배포된다
    // 👇 instantiate the nested stack again
    // const { vpc: vpcLambda } = new VpcNestedStack(this, 'nested-stack-lambda');

    // const lambdaFunction = new lambda.Function(this, 'lambda-function', {
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   // 👇 use the VPC from the second nested stack
    //   vpc: vpcLambda,
    //   vpcSubnets: {
    //     subnetType: ec2.SubnetType.PUBLIC,
    //   },
    //   allowPublicSubnet: true,
    //   handler: 'index.main',
    //   code: lambda.Code.fromAsset(path.join(__dirname, '/../src/my-nest')),
    //   environment: {
    //     VPC_CIDR: vpcLambda.vpcCidrBlock,
    //     VPC_ID: vpcLambda.vpcId,
    //   },
    // });  

  }
}
