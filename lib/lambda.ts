import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { ECRResources } from "./ecr";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { NetworkResources } from "./network";

export class LambdaResources extends Construct {
  public readonly lambdaFunction: lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    ecrResources: ECRResources,
    vpc: ec2.Vpc,
    region: string,
    accountId: string
  ) {
    super(scope, id);

    const secretJson = Secret.fromSecretAttributes(this, "SecretStrings", {
      secretCompleteArn: `arn:aws:secretsmanager:${region}:${accountId}:secret:newDatabaseSecret-eegf6t`,
    });

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      "BackendFunctionSecurityGroup",
      {
        vpc,
        description: "Allow Lambda to access the database",
        allowAllOutbound: true,
      }
    );

    // Lambda 関数を作成
    this.lambdaFunction = new lambda.Function(this, "BackendFunction", {
      functionName: "BackendFunction",
      code: lambda.Code.fromEcrImage(ecrResources.backendRepository, {
        tagOrDigest: "latest",
      }),
      runtime: lambda.Runtime.FROM_IMAGE,
      handler: lambda.Handler.FROM_IMAGE,
      timeout: cdk.Duration.seconds(10),
      environment: {
        POSTGRES_USER: `${secretJson
          .secretValueFromJson("username")
          .unsafeUnwrap()}`,
        POSTGRES_PASSWORD: `${secretJson
          .secretValueFromJson("password")
          .unsafeUnwrap()}`,
        POSTGRES_DB: `${secretJson
          .secretValueFromJson("dbname")
          .unsafeUnwrap()}`,
        HOST_NAME: `${secretJson.secretValueFromJson("host").unsafeUnwrap()}`,
        PORT_NUMBER: `${secretJson.secretValueFromJson("port").unsafeUnwrap()}`,
        SENTRY_DSN: ssm.StringParameter.valueForStringParameter(
          this,
          "/itrender/SENTRY_DSN/backend"
        ),
        ENVIRONMENT: "production",
      },
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // プライベートサブネットに配置
      },
      securityGroups: [lambdaSecurityGroup],
    });
    // ロググループの作成
    const logGroup = new logs.LogGroup(this, "BackendLambdaLogGroup", {
      logGroupName: `/lambda/${this.lambdaFunction.functionName}`,
      retention: logs.RetentionDays.THREE_DAYS, // ログ保持期間を3日間に設定
      removalPolicy: cdk.RemovalPolicy.DESTROY, // スタック削除時にロググループも削除
    });
  }
}
