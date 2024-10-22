import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { ECSResources } from "./ecs";

export class EventBridgeResources extends Construct {
  constructor(scope: Construct, id: string, ecsResources: ECSResources) {
    super(scope, id);
    const batchRule = new events.Rule(this, "BatchRule", {
      schedule: events.Schedule.cron({ minute: "0", hour: "15" }),
    });
    batchRule.addTarget(
      new targets.EcsTask({
        cluster: ecsResources.ecsCluster,
        taskDefinition: ecsResources.taskDefinition,
        subnetSelection: { subnetType: ec2.SubnetType.PUBLIC }, // 適切なサブネットを選択
        platformVersion: ecs.FargatePlatformVersion.LATEST,
      })
    );
  }
}
