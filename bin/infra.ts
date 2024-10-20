#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkResources } from '../lib/network';
import { ECRResources } from '../lib/ecr';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'Itrender' ,{
  synthesizer: new cdk.DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
}),
});


// ネットワークリソースを追加
new NetworkResources(stack, 'NetworkResources');

// ECRリソースを追加
new ECRResources(stack, 'ECRResources');