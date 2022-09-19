#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DefaultStackSynthesizer } from 'aws-cdk-lib';
import { CdkEc2SubnetSelect, CdkEc2Basic } from '../lib/snippet-ec2';
import { CdkVpcLevel1, CdkVpcLevel2, CdkVpcBasic } from '../lib/snippet-vpc';
import { CdkRds } from '../lib/snippet-rds';
import { CdkS3Basic, CdkS3Event } from '../lib/snippet-s3';
import { CdkApiGw, CdkApiGwCors } from '../lib/snippet-api-gw';
import { CdkAlb } from '../lib/snippet-alb';
import { CdkSg } from '../lib/snippet-sg';
import { CdkIamPolicy, CdkIamCondition, CdkIamGroup, CdkIamUser, CdkIamPrincipal, CdkIamPB } from '../lib/snippet-iam';
import { CdkSM } from '../lib/snippet-secretsManager';
import { CdkSqs } from '../lib/snippet-sqs';
import { CdkSns } from '../lib/snippet-sns';
import { CdkLambda } from '../lib/snippet-lambda';
import { UsingNestStackStack } from '../lib/snippet-nestStack';
import { CdkRemovalPolicy } from '../lib/snippet-etc';

// import { CdkStarterEnv } from '../lib/snippet-env';
// import { CdkStarterOutput } from '../lib/snippet-output';
// import { CdkStarterInput } from '../lib/snippet-input';


const app = new cdk.App();


// EC2
new CdkEc2SubnetSelect(app, 'CdkEc2SubnetSelect', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
    
  env: { account: '809692026207', region: 'ap-northeast-2' },
});

new CdkEc2Basic(app, 'CdkEc2Basic', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
    
  env: { account: '809692026207', region: 'ap-northeast-2' },
});


// lambda
new CdkLambda(app, 'CdkLambda', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
    
  env: { account: '809692026207', region: 'ap-northeast-2' },
});


// SG
new CdkSg(app, 'CdkSg', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
    
  env: { account: '809692026207', region: 'ap-northeast-2' },
});


// VPC
new CdkVpcLevel1(app, 'CdkVpcLevel1', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});

new CdkVpcLevel2(app, 'CdkVpcLevel2', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});

new CdkVpcBasic(app, 'CdkVpcBasic', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});


// IAM

new CdkIamPolicy(app, 'CdkIamPolicy', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});

new CdkIamCondition(app, 'CdkIamCondition', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});

new CdkIamGroup(app, 'CdkIamGroup', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});

new CdkIamUser(app, 'CdkIamUser', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});

new CdkIamPrincipal(app, 'CdkIamPrincipal', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});

new CdkIamPB(app, 'CdkIamPB', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});


// S3
new CdkS3Basic(app, 'CdkS3Basic', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});

new CdkS3Event(app, 'CdkS3Event', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});


// RDS
new CdkRds(app, 'CdkRds', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});


// GW
new CdkApiGw(app, 'CdkApiGw', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});

new CdkApiGwCors(app, 'CdkApiGwCors', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});


// ALB
new CdkAlb(app, 'CdkAlb', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});


// SecretsManager
new CdkSM(app, 'CdkSM', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});


// SNS
new CdkSns(app, 'CdkStarterSns', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});


// SQS
new CdkSqs(app, 'CdkSqs', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});


// 기타
// 중첩 스택
new UsingNestStackStack(app, 'UsingNestStackStack', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  env: { account: '809692026207', region: 'ap-northeast-2' },
});

// 스택 환경 변수
// new UsingNestStackStack(app, 'UsingNestStackStack', {
//   synthesizer: new DefaultStackSynthesizer({
//     generateBootstrapVersionRule: false
//   }),
//   stackName: 'test-stack',
//   terminationProtection: true,
//   env: { account: '809692026207', region: 'ap-northeast-2' },
// });

// 삭제 정책
// CDK에서 removalPolicy를 설정하기 위해서는 stateful 리소스 생성자에 removalPolicy prop을 설정해주면 된다 (s3, 다이나모)
new CdkRemovalPolicy(app, 'CdkRemovalPolicy', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
  stackName: 'test-stack',
  env: { account: '809692026207', region: 'ap-northeast-2' },
});

// 스택간 리소스 공유 부터!


// new CdkStarterEnv(app, 'my-stack-dev', {
//   stackName: 'my-stack-dev',
//   synthesizer: new DefaultStackSynthesizer({
//     generateBootstrapVersionRule: false
//   }),
//   env: { account: '809692026207', region: 'ap-northeast-2' },
//   deploymentEnvironment: 'dev',
// });

// new CdkStarterEnv(app, 'my-stack-prod', {
//   stackName: 'my-stack-prod',
//   synthesizer: new DefaultStackSynthesizer({
//     generateBootstrapVersionRule: false
//   }),
//   env: { account: '809692026207', region: 'ap-northeast-2' },
//   deploymentEnvironment: 'prod',
// });

// new CdkStarterOutput(app, 'CdkStarterOutput', {
//   synthesizer: new DefaultStackSynthesizer({
//     generateBootstrapVersionRule: false
//   }),
//   env: { account: '809692026207', region: 'ap-northeast-2' },
// });

// new CdkStarterInput(app, 'CdkStarterInput', {
//   synthesizer: new DefaultStackSynthesizer({
//     generateBootstrapVersionRule: false
//   }),
//   env: { account: '809692026207', region: 'ap-northeast-2' },
// });

