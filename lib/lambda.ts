import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { ECRResources } from "./ecr";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import * as ssm from "aws-cdk-lib/aws-ssm";

export class LambdaResources extends Construct {
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, ecrResources: ECRResources) {
    super(scope, id);

    const { region, accountId } = new cdk.ScopedAws(this);
    const secretJson = Secret.fromSecretAttributes(this, "SecretStrings", {
      secretCompleteArn: `arn:aws:secretsmanager:${region}:${accountId}:secret:itrenderDatabaseSecret-NdOd6w`,
    });

    // Lambda 関数を作成
    this.lambdaFunction = new lambda.Function(this, "BackendFunction", {
      functionName: "BackendFunction",
      code: lambda.Code.fromEcrImage(ecrResources.backendRepository, {
        tagOrDigest: "latest",
      }),
      runtime: lambda.Runtime.FROM_IMAGE,
      handler: lambda.Handler.FROM_IMAGE,
      timeout: cdk.Duration.seconds(30),
      logRetention: 7,
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
    });
  }
}
