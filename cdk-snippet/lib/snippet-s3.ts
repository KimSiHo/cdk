import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as path from 'path';

export class CdkS3Basic extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // s3 버킷 생성 코드
    // const s3Bucket = new s3.Bucket(this, 's3-bucket')

    // 👇 create bucket
    const s3Bucket = new s3.Bucket(this, 's3-bucket', {
      // 생략 시 알아서 글로벌 unique한 이름을 생성해준다
      // bucketName: 'my-bucket',

      // 스택 삭제시 버킷 삭제 옵션, 기본으로는 스택 삭제해도 버킷은 유지된다
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // 버킷 안에 파일들을 삭제 처리해준다, 이래야지 버킷을 삭제 가능, 이 옵션으로 객체를 삭제하기 위해 람다 function을 생성한다
      autoDeleteObjects: true,

      // 버저닝하고 public read access
      versioned: false,
      publicReadAccess: false,


      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: ['http://localhost:3000'],
          allowedHeaders: ['*'],
        },
      ],

      // 자주 조회되지 않은 객체들을 이동시키는 라이프 사이클 규칙
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(90),
          expiration: cdk.Duration.days(365),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // stack 이 생성되는 계정한테 read 권한을 s3 리소스 정책으로 준다
    // 👇 grant access to bucket
    s3Bucket.grantRead(new iam.AccountRootPrincipal());
    s3Bucket.grantWrite(new iam.AccountRootPrincipal());

    // 람다 function에 write 권한을 주는 것은 아래와 같이 하면 된다
    //s3Bucket.grantWrite(lambda);
  }
}


// s3 이벤트 발생 시 이벤트 핸들링 구성
// s3 이벤트 발생 시 이벤트 핸들링을 구성하기 위해서는 버킷 class에 addEventNotification 메소드를 호출해야 된다
// 한 개의 이벤트 타입에 한 개의 목적지만 설정 가능
export class CdkS3Event extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 define lambda
    const lambdaFunction = new lambda.Function(this, 'lambda-function', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.main',
      code: lambda.Code.fromAsset(path.join(__dirname, '/../src/my-lambda')),
    });

    // 👇 create bucket
    const s3Bucket = new s3.Bucket(this, 's3-bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });


    // 람다 로 이벤트 핸들링
    // 람다에 리소스 기반 policy로 s3 버킷이 람다를 invoke 할 수 있게 자동으로 설정해준다
    // 👇 invoke lambda every time an object is created in the bucket
    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(lambdaFunction), // 지원되는 도착지는 람다, sns, sqs이다
      // 👇 only invoke lambda if object matches the filter
      // {prefix: 'test/', suffix: '.yaml'},
    );

    new cdk.CfnOutput(this, 'bucketName', {
      value: s3Bucket.bucketName,
    });


    // SQS 로 이벤트 핸들링
    // const queue = new sqs.Queue(this, 'sqs-queue');

    // s3Bucket.addEventNotification(
    //   s3.EventType.OBJECT_REMOVED,
    //   new s3n.SqsDestination(queue),
    //   // 👇 only send message to queue if object matches the filter
    //   // {prefix: 'test/', suffix: '.png'},
    // );

    // new cdk.CfnOutput(this, 'queueName', {
    //   value: queue.queueName,
    // });


    // sns 로 이벤트 핸들링
    // const topic = new sns.Topic(this, 'sns-topic');

    // s3Bucket.addEventNotification(
    //   s3.EventType.REDUCED_REDUNDANCY_LOST_OBJECT,
    //   new s3n.SnsDestination(topic),
    //   // 👇 only send message to topic if object matches the filter
    //   // {prefix: 'test/', suffix: '.png'},
    // );

    // new cdk.CfnOutput(this, 'topicName', {
    //   value: topic.topicName,
    // });
  }
}
