import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';

// 삭제 정책
export class CdkRemovalPolicy extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // 오직 비어있는 S3 버켓만 삭제된다, removalPolicy만 설정하면.
    // 내용물이 있는 버켓도 삭제하려면 autoDeleteObjects prop도 설정해야 한다
    const s3Bucket = new s3.Bucket(this, id, {
      // 👇 set a removal policy of DESTROY
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // retain으로 생성해서, 스택을 삭제해도 리소스가 남지만 스택에서 고아 처리된다
    // 특정 리소스에서만 (rds, efs 볼륨) 사용할 수있는 스냅샷 옵션도 있다
    const table = new dynamodb.Table(this, 'my-table', {
      partitionKey: {name: 'todoId', type: dynamodb.AttributeType.NUMBER},
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      // 👇 set a removal policy of RETAIN
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    //CFN 리소스는 removalPolicy prop을 구현하지 않는다, CFN 리소스에 removalPolicy를 설정하려면 인스턴스로 만든후 applyRemovalPolicy를 호출
    // 리소스 생성자의 id를 바꾸거나 다른 scope로 이동시키는 것은 리소스의 클라우드 포매이션 논리적 id를 변경시킨다
    // 이것은 리소스 교체를 유발해 오래된 리소스가 삭제 처리되고 새로운 리소스가 새로운 아이디로 생성되게 된다
  }
}


// 종료 삭제 방지
// 클라우드 포매이션의 termination protection 기능은 실수로 삭제하는 것을 방지해준다. 우리의 CDK는 배포되기전에 클라우드 포매이션으로 컴파일되므로 해당 이점을 사용할 수 있다
// 해당 기능을 활성화하면 스택 삭제시 오류가 리턴된다
export class CdkTerminationPolicy extends cdk.Stack {

}


// 레벨 1 생성자는 클라우드 포매이션 리소스와 1대1 매칭되고 Cfn 접두사로 시작
// 레벨 2 생성자는 편리한 기본값하고 다른 서비스들하고 연결하기 편한 glue 메소드를 가지고 있다 예를 들어 permission grants
// 레벨 2 생성자는 레벨 1 생성자를 감싸기 위한 많은 메소드를 가지고 잇다 (s3의 경우 frombucketName, fromBucketArn, fromBucketAttributes)
// 반대로 레벨 2에서는 노출되지 않은 속성을 제어하기 위해 레벨 2 생성자로부터 레벨 1 리소스가 필요한 경우 escape hatch를 사용하면 된다
export class CdkConstructorLevel extends cdk.Stack {

}