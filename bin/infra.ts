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
import { S3Resources } from "../lib/s3";
import { CloudFrontResources } from "../lib/cloudfront";
import { LambdaResources } from "../lib/lambda";
import { ApiGatewayResources } from "../lib/apigateway";
import { CodePipelineResources } from "../lib/codepipeline";

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
// S3リソースを追加
const s3Resources = new S3Resources(stack, "S3Resources");
// RDSリソースを追加
const rdsResources = new RDSResources(
  stack,
  "RDSResources",
  networkResources.vpc
);
// ECSリソースを追加
const ecsResources = new ECSResources(
  stack,
  "ECSResources",
  networkResources.vpc,
  iamResources,
  ecrResources,
  rdsResources
);
// Lambdaリソースを追加
const lambdaResources = new LambdaResources(
  stack,
  "LambdaResources",
  ecrResources,
  networkResources.vpc
);
// apigatewayリソースの追加
const apigatewayResources = new ApiGatewayResources(
  stack,
  "apigatewayResources",
  lambdaResources
);
// CloudFrontリソースを追加
const cloudfrontResources = new CloudFrontResources(
  stack,
  "CloudFrontResources",
  s3Resources,
  apigatewayResources
);
// CodePipelineリソースを追加
const codepipelineResources = new CodePipelineResources(
  stack,
  "CodePipelineResources",
  ecrResources,
  lambdaResources
);
// EventBridgeリソースを追加
const eventbridgeResources = new EventBridgeResources(
  stack,
  "EventBridgeResources",
  ecsResources,
  ecrResources,
  codepipelineResources
);
