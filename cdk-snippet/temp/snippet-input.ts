import * as lambda from 'aws-cdk-lib/aws-lambda';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';

export class CdkStarterInput extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const importedBucketValue = cdk.Fn.importValue('myBucket');
    console.log('importedBucketValue 👉', importedBucketValue.toString());

    const myFunction = new NodejsFunction(this, 'my-function', {
      // 👇 Pass the imported bucket name as env var
      environment: {
        BUCKET_NAME: importedBucketValue.toString(),
      },
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: cdk.Duration.seconds(4),
      handler: 'main',
      entry: path.join(__dirname, `/../src/my-lambda/index.js`),
    });
  }
}
