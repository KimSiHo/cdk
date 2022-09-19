import * as lambda from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';

// sqs와 sns를 만들고 sqs를 sns의 구독자로 등록, sqs는 메시지를 받으면 람다 함수를 트리거 해서 람다 함수가 실행
// 람다 함수에서 가져가지 못하면 dlq로 이동하고 dlq도 별도의 람다 함수로 처리
export class CdkSqs extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 create DLQ lambda function
    const dlqLambda = new NodejsFunction(this, 'dlq-lambda', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, `/../src/dlq-lambda/index.ts`),
    });

    // 👇 create dead letter queue
    const deadLetterQueue = new sqs.Queue(this, 'dead-letter-queue', {
      retentionPeriod: cdk.Duration.minutes(30),
    });

    // 👇 add dead letter queue as event source for dlq lambda function
    dlqLambda.addEventSource(new SqsEventSource(deadLetterQueue));


    // 👇 create queue
    // 1번의 재시도 끝에 정상적으로 처리되지 않으면 dlq로 전송
    const queue = new sqs.Queue(this, 'sqs-queue', {
      // 👇 set up DLQ
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 1,
      },
    });

    // 👇 create sns topic
    const topic = new sns.Topic(this, 'sns-topic');

    // 👇 subscribe queue to topic
    topic.addSubscription(new subs.SqsSubscription(queue));

   

    // 👇 create lambda function
    const myLambda = new NodejsFunction(this, 'my-lambda', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, `/../src/my-lambda/index-queue.ts`),
    });

    // 기본으로 람다는 20초마다 큐에서 메시지를 가져온다, 배치 사이즈는 람다가 sqs로부터 받을 수 있는 최대 갯수의 레코드이다
    // 👇 add sqs queue as event source for lambda
    myLambda.addEventSource(
      new SqsEventSource(queue, {
        batchSize: 10,
      }),
    );

    new cdk.CfnOutput(this, 'snsTopicArn', {
      value: topic.topicArn,
      description: 'The arn of the SNS topic',
    });

  }
}