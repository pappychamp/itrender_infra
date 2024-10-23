import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as logs from "aws-cdk-lib/aws-logs";
import { IAMResources } from "./iam";
import { ECRResources } from "./ecr";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as cdk from "aws-cdk-lib";

export class ECSResources extends Construct {
  public readonly ecsCluster: ecs.Cluster;
  public readonly taskDefinition: ecs.FargateTaskDefinition;

  constructor(
    scope: Construct,
    id: string,
    vpc: ec2.Vpc,
    iamResources: IAMResources,
    ecrResources: ECRResources
  ) {
    super(scope, id);
    // ECSクラスターの作成
    this.ecsCluster = new ecs.Cluster(this, "itrenderCluster", {
      vpc: vpc,
      clusterName: "itrenderCluster",
    });

    // ECSタスク定義の作成
    this.taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "itrenderTaskDefinition",
      {
        cpu: 256, // CPUの割り当て
        memoryLimitMiB: 512, // メモリの割り当て
        executionRole: iamResources.taskExecutionRole, // タスク実行ロールを指定
        family: "TestTaskDefinition",
      }
    );

    // コンテナの定義
    this.taskDefinition.addContainer("BatchTask", {
      image: ecs.ContainerImage.fromEcrRepository(
        ecrResources.batchRepository,
        "latest"
      ),
      logging: new ecs.AwsLogDriver({
        streamPrefix: "ecs",
        logGroup: new logs.LogGroup(this, "BatchLogGroup", {
          logGroupName: "/ecs/batch-task",
          retention: logs.RetentionDays.ONE_WEEK,
        }),
      }),
      containerName: "BatchTask",
      portMappings: [
        {
          containerPort: 80,
          hostPort: 80,
          protocol: ecs.Protocol.TCP,
        },
      ],
      essential: true,
      environment: {
        ENVIRONMENT: "production",
      },
      secrets: {
        HOST_NAME: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromStringParameterName(
            this,
            "HostName",
            "/itrender/HOST_NAME"
          )
        ),
        PORT_NUMBER: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromStringParameterName(
            this,
            "PortNumber",
            "/itrender/PORT_NUMBER"
          )
        ),
        POSTGRES_DB: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromStringParameterName(
            this,
            "PostgresDB",
            "/itrender/POSTGRES_DB"
          )
        ),
        POSTGRES_PASSWORD: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromStringParameterName(
            this,
            "PostgresPassword",
            "/itrender/POSTGRES_PASSWORD"
          )
        ),
        POSTGRES_USER: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromStringParameterName(
            this,
            "PostgresUser",
            "/itrender/POSTGRES_USER"
          )
        ),
        QIITA_ACCESS_TOKEN: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromStringParameterName(
            this,
            "QiitaAccessToken",
            "/itrender/QIITA_ACCESS_TOKEN"
          )
        ),
        SENTRY_DSN: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromStringParameterName(
            this,
            "SentryDsn",
            "/itrender/SENTRY_DSN/batch"
          )
        ),
        YOUTUBE_API_KEY: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromStringParameterName(
            this,
            "YoutubeApiKey",
            "/itrender/YOUTUBE_API_KEY"
          )
        ),
      },
    });
  }
}
