import * as lambda from 'aws-cdk-lib/aws-lambda';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';

// 람다와 큐를 구독으로 가지는 기본 sns 토픽 생성
export class CdkSns extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

     // 👇 create sns topic
     const topic = new sns.Topic(this, 'sns-topic', {
      displayName: 'My SNS topic',
    });

    // 👇 create lambda function
    const myLambda = new NodejsFunction(this, 'my-lambda', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'main',
      entry: path.join(__dirname, `/../src/my-lambda/index.ts`),
    });

    // 👇 subscribe Lambda to SNS topic
    topic.addSubscription(new subs.LambdaSubscription(myLambda));

    const queue = new sqs.Queue(this, 'sqs-queue');
    // 👇 subscribe queue to topic
    topic.addSubscription(new subs.SqsSubscription(queue));

    new cdk.CfnOutput(this, 'snsTopicArn', {
      value: topic.topicArn,
      description: 'The arn of the SNS topic',
    })
  }
}