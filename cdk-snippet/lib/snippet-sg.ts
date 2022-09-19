import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';

// 기존 SG import 하는 법
export class CdkSg extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 import security group by ID
    const importedSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'imported-security-group',
      'YOUR-SG-ID',
      // 기본으로 가져오는 sg의 모든 egress 룰이 전부 허용으로 간주하고 egress는 수정하지 않는다
      // egress를 수정하려면 allowAllOutbound를 false로 설정해야 한다

      //mutable도 수정 가능성을 명시하는 것으로 inbound룰을 수정할 수 있다, allow프로퍼티가 false로 설정되어 있지 않은 이상 inbound 룰만 수정 가능
      { allowAllOutbound: true, mutable: true },
    );

    console.log('security group id 👉', importedSecurityGroup.securityGroupId);

    // 👇 `mutable` is `true`, so we can add ingress rules
    importedSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'allow SSH access from anywhere',
    );

    // const importedSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
    //   this,
    //   'imported-security-group',
    //   'sg-0364cc5f9a979e9a6',
    //   { allowAllOutbound: false, mutable: true },
    // );

    // // 👇 `mutable` is `true`, so we can add egress rules
    // importedSecurityGroup.addEgressRule(
    //   ec2.Peer.ipv4('10.0.0.0/16'),
    //   ec2.Port.tcp(3306),
    //   'allow outgoing traffic on port 3306',
    // );
  }
}