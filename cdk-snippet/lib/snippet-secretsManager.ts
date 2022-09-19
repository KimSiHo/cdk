import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';

export class CdkSM extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // secret의 이름으로 가져오는 방법
    // 에러 발생
    // 👇 get access to the secret object
    // const dbPasswordSecret = secretsmanager.Secret.fromSecretNameV2(
    //   this,
    //   'db-pwd-id',
    //   'databasePassword',
    // );

    // arn으로 가져오는 방법,  partialArn으로 뒤에 6자리 suffix를 제외하고 arn을 명시, secretCompleteArn 은 전체 명시
    // 에러 발생
    // const dbPasswordSecret = secretsmanager.Secret.fromSecretAttributes(
    //   this,
    //   'db-pwd-id',
    //   {
    //     secretPartialArn:
    //       'arn:aws:secretsmanager:ap-northeast-2:809692026207:secret:databasePassword',
    //   },
    // );

    // arn으로 가져오는 메소드
    // const dbPasswordSecret = secretsmanager.Secret.fromSecretPartialArn(
    //   this,
    //   'db-pwd-id',
    //   'arn:aws:secretsmanager:ap-northeast-2:809692026207:secret:databasePassword',
    // );

    // const dbPasswordSecret = secretsmanager.Secret.fromSecretCompleteArn(
    //   this,
    //   'db-pwd-id',
    //   'arn:aws:secretsmanager:ap-northeast-2:809692026207:secret:databasePassword-275qTc',
    // );


    // const myFunction = new NodejsFunction(this, 'my-function', {
    //   // 👇 set secret value as ENV variable
    //   environment: {
    //     SECRET_NAME: dbPasswordSecret.secretName,
    //     SECRET_VALUE: dbPasswordSecret.secretValue.toString(),
    //   },
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   memorySize: 1024,
    //   timeout: cdk.Duration.seconds(5),
    //   handler: 'main',
    //   entry: path.join(__dirname, `/../src/my-lambda/index-SM.js`),
    // });
  }
}