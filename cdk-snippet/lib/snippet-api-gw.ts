import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import {CorsHttpMethod, HttpApi} from '@aws-cdk/aws-apigatewayv2-alpha';


// 기본 api gw 생성 코드
// RestApi 클래스를 통해 생성. 
export class CdkApiGw extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new apigateway.RestApi(this, 'api', {
      description: 'example api gateway',

      // api url 네이밍에 사용된다. 기본 값은 prod
      deployOptions: {
        stageName: 'dev',
      },

      // 👇 enable CORS
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: ['http://localhost:3000'],
      },
    });

    // 👇 create an Output for the API URL
    new cdk.CfnOutput(this, 'apiUrl', { value: api.url });


    // 👇 define GET todos function
    const getTodosLambda = new lambda.Function(this, 'get-todos-lambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.main',
      code: lambda.Code.fromAsset(path.join(__dirname, '/../src/get-todos')),
    });

    // 👇 add a /todos resource
    const todos = api.root.addResource('todos');

    // 기본이 프록시 활성화이다
    // 👇 integrate GET /todos with getTodosLambda
    todos.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getTodosLambda, { proxy: true }),
    );

    // 👇 define delete todo function
    const deleteTodoLambda = new lambda.Function(this, 'delete-todo-lambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.main',
      code: lambda.Code.fromAsset(path.join(__dirname, '/../src/delete-todo')),
    });

    // 계층적으로 리소스를 등록한다
    // 👇 add a /todos/{todoId} resource
    const todo = todos.addResource('{todoId}');

    // 👇 integrate DELETE /todos/{todoId} with deleteTodosLambda
    todo.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteTodoLambda),
    );
  }
}


// GW cors 설정하는 법
export class CdkApiGwCors extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const httpApi = new HttpApi(this, 'cors-demo-api', {
      description: 'API for CORS demo',
      corsPreflight: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: [
          CorsHttpMethod.OPTIONS,
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
        ],
        allowCredentials: true,
        allowOrigins: ['http://localhost:3000'],

        // 👇 optionally cache responses to preflight requests, 기본 값으로 캐시하지 않는다
        // maxAge: cdk.Duration.minutes(5),
      },
    });
  }
}