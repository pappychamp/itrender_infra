import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { ECSResources } from "./ecs";
import { ECRResources } from "./ecr";
import { CodePipelineResources } from "./codepipeline";

export class EventBridgeResources extends Construct {
  constructor(
    scope: Construct,
    id: string,
    ecsResources: ECSResources,
    ecrResources: ECRResources,
    codepipelineResources: CodePipelineResources
  ) {
    super(scope, id);

    // バッチECSを定期的に実行するイベントルール
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

    // BackendECRにプッシュされたらCodePipelineを呼び出すイベントルール
    new events.Rule(this, "BackendEcrPushRule", {
      eventPattern: {
        source: ["aws.ecr"],
        detailType: ["ECR Image Action"],
        detail: {
          "action-type": ["PUSH"],
          repositoryName: [ecrResources.backendRepository.repositoryName],
        },
      },
      targets: [
        new targets.CodePipeline(codepipelineResources.backendPipeline),
      ],
    });
  }
}
