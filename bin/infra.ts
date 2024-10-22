#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { NetworkResources } from "../lib/network";
import { ECRResources } from "../lib/ecr";
import { SecurityGroupResources } from "../lib/sg";
import { IAMResources } from "../lib/iam";
import { ECSResources } from "../lib/ecs";
import { EventBridgeResources } from "../lib/eventbridge";
import { RDSResources } from "../lib/rds";

const app = new cdk.App();
const stack = new cdk.Stack(app, "Itrender", {
  synthesizer: new cdk.DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
});

// ネットワークリソースを追加
const networkResources = new NetworkResources(stack, "NetworkResources");
// ECRリソースを追加
const ecrResources = new ECRResources(stack, "ECRResources");
// SecurityGrouypを追加
const securitygroupResources = new SecurityGroupResources(
  stack,
  "SecurityGroupResources",
  networkResources.vpc
);
// IAMリソースを追加
const iamResources = new IAMResources(stack, "IAMResources");
// const ecsResources = new ECSResources(
//   stack,
//   "ECSResources",
//   networkResources.vpc,
//   iamResources,
//   ecrResources
// );
// const eventbridgeResources = new EventBridgeResources(
//   stack,
//   "EventBridgeResources",
//   ecsResources
// );
// const rdsResources = new RDSResources(
//   stack,
//   "RDSResources",
//   networkResources.vpc
// );
