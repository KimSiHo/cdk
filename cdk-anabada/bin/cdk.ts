#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DefaultStackSynthesizer } from 'aws-cdk-lib';

import { CdkAnabada } from '../lib/cdk-anabada';

const app = new cdk.App();

new CdkAnabada(app, 'CdkAnabada', {
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false
  }),
    
  env: { account: '809692026207', region: 'ap-northeast-2' },
});
