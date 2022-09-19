import * as lambda from 'aws-cdk-lib/aws-lambda';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';

export class CdkStarterOutput extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const myBucket = new s3.Bucket(this, 'myBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 👇 export myBucket for cross-stack reference
    new cdk.CfnOutput(this, 'myBucketRef', {
      value: myBucket.bucketName,
      description: 'The name of the s3 bucket',
      exportName: 'myBucket',
    });
  }
}
