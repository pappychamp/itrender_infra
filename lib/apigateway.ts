import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import { Construct } from "constructs";
import { LambdaResources } from "./lambda";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as logs from "aws-cdk-lib/aws-logs";

export class ApiGatewayResources extends Construct {
  public readonly BackendApiEndpoint: string;

  constructor(scope: Construct, id: string, lambdaResources: LambdaResources) {
    super(scope, id);

    // CloudWatch ロググループの作成
    const logGroup = new logs.LogGroup(this, "ApiGatewayAccessLogs", {
      logGroupName: "/apigateway",
      retention: logs.RetentionDays.ONE_WEEK,
    });
    const logGroup2 = new logs.LogGroup(this, "ApiGatewayAccessLogs2", {
      logGroupName: "/apigateway2",
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // API Gateway を作成
    const backendApiGW = new apigateway.HttpApi(this, "BackendApiGW", {
      apiName: "BackendApiGW",
      createDefaultStage: false,
    });

    // API Gateway ルートを定義
    backendApiGW.addRoutes({
      path: "/{proxy+}",
      methods: [apigateway.HttpMethod.ANY],
      integration: new HttpLambdaIntegration(
        "BackendIntegration",
        lambdaResources.lambdaFunction
      ),
    });
    const apiStage = backendApiGW.addStage("prod", {
      stageName: "api",
      autoDeploy: true,
      throttle: {
        burstLimit: 50, // 瞬間的なリクエスト制限
        rateLimit: 10, // 毎秒のリクエスト制限
      },
    });
    const apiStage2 = backendApiGW.addStage("dev", {
      stageName: "dev",
      autoDeploy: true,
    });
    const stage = apiStage.node.defaultChild as apigateway.CfnStage;
    stage.accessLogSettings = {
      destinationArn: logGroup.logGroupArn,
      format:
        '{ "requestId":"$context.requestId", "ip": "$context.identity.sourceIp", "user":"$context.identity.user","requestTime":"$context.requestTime", "httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath", "status":"$context.status", "errorMessage": "$context.error.message", "protocol":"$context.protocol" }',
    };
    const stage2 = apiStage2.node.defaultChild as apigateway.CfnStage;
    stage2.accessLogSettings = {
      destinationArn: logGroup2.logGroupArn,
      format:
        '{ "requestId":"$context.requestId", "ip": "$context.identity.sourceIp", "user":"$context.identity.user","requestTime":"$context.requestTime", "httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath", "status":"$context.status", "errorMessage": "$context.error.message", "protocol":"$context.protocol" }',
    };

    // API Gateway エンドポイントの URL を取得
    this.BackendApiEndpoint = backendApiGW.apiEndpoint;
  }
}
