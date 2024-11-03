import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import { Construct } from "constructs";
import { LambdaResources } from "./lambda";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

export class ApiGatewayResources extends Construct {
  public readonly BackendApiEndpoint: string;

  constructor(scope: Construct, id: string, lambdaResources: LambdaResources) {
    super(scope, id);

    // API Gateway を作成
    const backendApiGW = new apigateway.HttpApi(this, "BackendApiGW", {
      apiName: "BackendApiGW",
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

    // API Gateway エンドポイントの URL を取得
    this.BackendApiEndpoint = backendApiGW.apiEndpoint;
  }
}
