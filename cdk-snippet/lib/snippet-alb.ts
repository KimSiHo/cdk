import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { CfnOutput, Duration, StackProps, Stack, App } from 'aws-cdk-lib';

export class CdkAlb extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // 기본으로 public, private subnet 가용 영역 3개 VPC 생성
    const vpc = new ec2.Vpc(this, 'vpc', { natGateways: 1 });

    // ALB에 퍼블릭 ip 할당 기본으로 비활성화 되어 있다
    const alb = new elbv2.ApplicationLoadBalancer(this, 'alb', {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener('Listener', {
      port: 80,
      open: true,
    });

    // 👇 create user data script
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      "sudo su",
      "yum install -y httpd",
      "systemctl start httpd",
      "systemctl enable httpd",
      'echo "<h1>Hello World from $(hostname -f)</h1>" > /var/www/html/index.html'
    );

    // 기본으로 인스턴스는 private subnet에 생성
    // 👇 create auto scaling group
    const asg = new autoscaling.AutoScalingGroup(this, "asg", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      userData,
      minCapacity: 2,
      maxCapacity: 3,
    });

    // 👇 add target to the ALB listener
    listener.addTargets("default-target", {
      port: 80,
      targets: [asg],
      healthCheck: {
        path: "/",
        unhealthyThresholdCount: 2,
        healthyThresholdCount: 5,
        interval: Duration.seconds(30),
      },
    });

    // 👇 add an action to the ALB listener
    listener.addAction("/static", {
      priority: 5,
      conditions: [elbv2.ListenerCondition.pathPatterns(["/static"])],
      action: elbv2.ListenerAction.fixedResponse(200, {
        contentType: "text/html",
        messageBody: "<h1>Static ALB Response</h1>",
      }),
    });

    // 👇 add scaling policy for the Auto Scaling Group
    asg.scaleOnRequestCount("requests-per-minute", {
      targetRequestsPerMinute: 60,
    });

    // 👇 add scaling policy for the Auto Scaling Group
    asg.scaleOnCpuUtilization("cpu-util-scaling", {
      targetUtilizationPercent: 75,
    });

    // 👇 add the ALB DNS as an Output
    new CfnOutput(this, "albDNS", {
      value: alb.loadBalancerDnsName,
    });
  }
}
