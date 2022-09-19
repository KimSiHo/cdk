import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

// level1 생성자
export class CdkVpcLevel1 extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new ec2.CfnVPC(this, 'helloVpc', {
      cidrBlock: "10.0.0.0/16"
    });
  }
}


// level2 생성자
export class CdkVpcLevel2 extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new ec2.Vpc(this, 'helloVpc', {
      maxAzs: 2,
      vpcName: 'vpcHello'
    });
  }
}

// subnet select
// {
//   const publicSubnets = vpc.selectSubnets({
//     subnetType: ec2.SubnetType.PUBLIC,
//   })

//   for (const subnet of publicSubnets.subnetIds) {

//   }
// }


// 기본 사용법
export class CdkVpcBasic extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 서브넷 3개가 가용 영역 당 한개씩 총 9개가 생기고 nat 게이트웨이는 public에 한 개만 생긴다 (한개 씩이 아니라 총 1개), 
    // 가용 영역 선택은 임의로 한군데 (a로 시작하는 서브넷에 생성 됨)
    // nat 게이트웨이를 통해 private에 있는 ec2가 인터넷 통신 가능, 외부에서 private subnet 접근은 불가
    // 아래 케이스에서는 2개의 private subnet은 다른 az존에 있는 nat 게이트웨이를 쓰게된다 결과적으로

    // 기본 생성되는 리소스: VPC, subnets, 라우트 테이블, igw, nat gw, nacl, sg
    const vpc = new ec2.Vpc(this, 'my-cdk-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 1,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'private-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24,
        },
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

    // VPC 네임 태그 추가
    cdk.Aspects.of(vpc).add(new cdk.Tag('Name', 'my-cdk-vpc'));

    // subnet 순회하면서 태그 추가
    // 👇 update the Name tag for private subnets
    for (const subnet of vpc.privateSubnets) {
      cdk.Aspects.of(subnet).add(
        new cdk.Tag(
          'Name',
          `${vpc.node.id}-${subnet.node.id.replace(/Subnet[0-9]$/, '')}-${
            subnet.availabilityZone
          }`,
        ),
      );
    }

    // 👇 update the Name tag for private subnets
    for (const subnet of vpc.isolatedSubnets) {
      cdk.Aspects.of(subnet).add(
        new cdk.Tag(
          'Name',
          `${vpc.node.id}-${subnet.node.id.replace(/Subnet[0-9]$/, '')}-${
            subnet.availabilityZone
          }`,
        ),
      );
    }

    // 함수 방식으로는 이렇게
    tagSubnets(vpc.publicSubnets, 'Name', 'my-public-subnet')

    function tagSubnets(subnets: ec2.ISubnet[], tagName: string, tagValue: string) {
      for (const subnet of subnets) {
        cdk.Aspects.of(subnet).add(new cdk.Tag(tagName, tagValue));
      }
    }
  }
}

// stack 공유
export class CdkVpcShare extends cdk.Stack {  
  // 👇 set a property for the vpc
  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'my-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
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

// 👇 extend the props interface of LambdaStack
interface LambdaStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class CdkVpcLambda extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const {vpc} = props;

    cdk.Tags.of(vpc).add('environment', 'development');
    cdk.Tags.of(vpc).add('department', 'dpt123');

    // 👇 lambda function definition
    const lambdaFunction = new lambda.Function(this, 'lambda-function', {
      // 👇 place lambda in shared VPC
      vpc,
      allowPublicSubnet: true,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.main',
      code: lambda.Code.fromAsset(path.join(__dirname, '/../src/my-lambda')),
      environment: {
        // 👇 pass the VPC ID as an environment variable
        VPC_ID: vpc.vpcId,
      },
    });
  }
}