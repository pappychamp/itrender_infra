import { Construct } from "constructs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as chatbot from "aws-cdk-lib/aws-chatbot";
import * as iam from "aws-cdk-lib/aws-iam";
import * as notifications from "aws-cdk-lib/aws-codestarnotifications";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { CodePipelineResources } from "./codepipeline";

export class SNSResources extends Construct {
  //   public readonly lambdaFunction: lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    codepipelineResources: CodePipelineResources
  ) {
    super(scope, id);
    // SNSトピックの作成
    const pipelineSNSTopic = new sns.Topic(this, "PipelineSNSTopic", {
      displayName: "codepipeline-sns-topic",
    });

    // SNSトピックのアクセスポリシー
    pipelineSNSTopic.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["sns:Publish"],
        principals: [new iam.ServicePrincipal("codepipeline.amazonaws.com")],
        resources: [pipelineSNSTopic.topicArn],
      })
    );
    // ChatbotのIAMロール作成
    const chatbotRole = new iam.Role(this, "ChatbotRole", {
      roleName: "pipeline-chatbot-role",
      assumedBy: new iam.ServicePrincipal("chatbot.amazonaws.com"),
    });

    // ChatbotのSlackチャンネル設定
    const slackChannelId = ssm.StringParameter.valueForStringParameter(
      this,
      "/slack/codepipelineid"
    );
    const slackWorkspaceId = ssm.StringParameter.valueForStringParameter(
      this,
      "/slack/workspaceid"
    );

    new chatbot.SlackChannelConfiguration(this, "MyChatbotSlackChannel", {
      slackChannelConfigurationName: "codepipeline-channel",
      slackChannelId: slackChannelId, // SlackチャンネルID
      slackWorkspaceId: slackWorkspaceId, // SlackワークスペースID
      notificationTopics: [pipelineSNSTopic],
      role: chatbotRole,
    });

    // CodePipelineに通知を設定
    new notifications.NotificationRule(
      this,
      "BackendPipelineNotificationRule",
      {
        source: codepipelineResources.backendPipeline,
        events: [
          "codepipeline-pipeline-pipeline-execution-started",
          "codepipeline-pipeline-pipeline-execution-succeeded",
          "codepipeline-pipeline-pipeline-execution-failed",
        ],
        targets: [pipelineSNSTopic],
      }
    );
    new notifications.NotificationRule(this, "BatchPipelineNotificationRule", {
      source: codepipelineResources.batchPipeline,
      events: [
        "codepipeline-pipeline-pipeline-execution-started",
        "codepipeline-pipeline-pipeline-execution-succeeded",
        "codepipeline-pipeline-pipeline-execution-failed",
      ],
      targets: [pipelineSNSTopic],
    });
  }
}
