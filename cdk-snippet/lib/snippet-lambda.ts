import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';

// 기존 람다 import
export class CdkLambda extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 람다 function 은 ts로 작성하기 위해서는 NodejsFunction 생성자를 사용하면 된다, 해당 생성자는 esbuild를 자동적으로 사용해 우리 코드를 트랜스파일하고 번들한다
    // entry 속성은 람다 함수의 소스코드 파일 위치이다 해당 속성은 js하고 ts를 지원, 다른 속성은 일반 Function 생성자의 속성들하고 동일하다
    // 우리가 작성한 CDK 코드는 배포되기 전에 cloudformation으로 컴파일된다, 해당 클라우드포매이션 파일은 cdk.out 디렉토리에 저장되고 해당 디렉토리에 람다 펑션의 asset 파일도
    // 저장된다, 해당 asset 폴더에서 js로 컴파일된 람다 펑션 소스 코드를 볼 수 있다
    const myFunction = new NodejsFunction(this, 'my-function', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      projectRoot: "../CDK-SNIPPET",
      handler: 'main',
      entry: path.join(__dirname, '/../src/my-lambda/index.ts'),
      // minify는 공백 없이 해서 람다 펑션 소스 코드의 파일 사이즈를 줄일 것인지 옵션
      // 람다 코드하고 함께 번들되지 않은 모듈을 명시하다, 람다 런타임에 제공되는 모듈들을 제외
      bundling: {
        minify: true,
        externalModules: ['aws-sdk'],
      },
    });


    // 기존 람다 import 해서 api gw에 통합
    // 👇 import existing Lambda by ARN
    const importedLambdaFromArn = lambda.Function.fromFunctionArn(
      this,
      'external-lambda-from-arn',
      `arn:aws:lambda:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account
      }:function:YOUR_FUNCTION_NAME`,
    );

    console.log('functionArn 👉', importedLambdaFromArn.functionArn);
    console.log('functionName 👉', importedLambdaFromArn.functionName);

    // 👇 create API
    const api = new apigateway.RestApi(this, 'api');

    // 👇 add a /test route on the API
    const test = api.root.addResource('test');

    // 👇 integrate imported Lambda at GET /test on the API
    test.addMethod(
      'GET',
      new apigateway.LambdaIntegration(importedLambdaFromArn),
    );
  }
}