import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  githubUserName,
  githubBatchRepositoryName,
  githubFrontendRepositoryName,
  githubBackendRepositoryName,
} from "./constants";
import { Stack } from "aws-cdk-lib";
import { CfnAccount } from "aws-cdk-lib/aws-apigateway";
export class IAMResources extends Construct {
  public readonly taskExecutionRole: iam.Role;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // GitHub OIDC Providerの作成
    const GithubOIDCProvider = new iam.CfnOIDCProvider(
      this,
      "GithubOIDCProvider",
      {
        url: "https://token.actions.githubusercontent.com",
        clientIdList: ["sts.amazonaws.com"],
        thumbprintList: ["6938fd4d98bab03faadb97b34396831e3780aea1"],
      }
    );

    // IAMロールの作成
    const githubBatchRepoIAMRole = new iam.CfnRole(
      this,
      "GithubBatchRepoIAMRole",
      {
        roleName: "GithubBatchRepoIAMRole",
        description: "Github batch repo use role",
        assumeRolePolicyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Federated: GithubOIDCProvider.ref, // OIDCプロバイダを参照
              },
              Action: "sts:AssumeRoleWithWebIdentity",
              Condition: {
                StringEquals: {
                  "token.actions.githubusercontent.com:aud":
                    "sts.amazonaws.com",
                },
                StringLike: {
                  "token.actions.githubusercontent.com:sub": `repo:${githubUserName}/${githubBatchRepositoryName}:ref:refs/heads/main`,
                },
              },
            },
          ],
        },
        policies: [
          {
            policyName: "ECRPushPolicy",
            policyDocument: {
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Action: ["ecr:GetAuthorizationToken"],
                  Resource: "*",
                },
                {
                  Effect: "Allow",
                  Action: [
                    "ecr:CompleteLayerUpload",
                    "ecr:UploadLayerPart",
                    "ecr:InitiateLayerUpload",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:PutImage",
                    "ecr:BatchGetImage",
                  ],
                  Resource: "*",
                },
              ],
            },
          },
        ],
      }
    );
    const githubFrontendRepoIAMRole = new iam.CfnRole(
      this,
      "GithubFrontendRepoIAMRole",
      {
        roleName: "GithubFrontendRepoIAMRole",
        description: "Github Frontend repo use role",
        assumeRolePolicyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Federated: GithubOIDCProvider.ref, // OIDCプロバイダを参照
              },
              Action: "sts:AssumeRoleWithWebIdentity",
              Condition: {
                StringEquals: {
                  "token.actions.githubusercontent.com:aud":
                    "sts.amazonaws.com",
                },
                StringLike: {
                  "token.actions.githubusercontent.com:sub": `repo:${githubUserName}/${githubFrontendRepositoryName}:ref:refs/heads/main`,
                },
              },
            },
          ],
        },
        policies: [
          {
            policyName: "S3DeployPolicy",
            policyDocument: {
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Action: [
                    "s3:PutObject",
                    "s3:PutObjectAcl",
                    "s3:DeleteObject",
                    "s3:ListBucket",
                  ],
                  Resource: "*",
                },
              ],
            },
          },
        ],
      }
    );
    const githubBackendRepoIAMRole = new iam.CfnRole(
      this,
      "GithubBackendRepoIAMRole",
      {
        roleName: "GithubBackendRepoIAMRole",
        description: "Github Backend repo use role",
        assumeRolePolicyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Federated: GithubOIDCProvider.ref, // OIDCプロバイダを参照
              },
              Action: "sts:AssumeRoleWithWebIdentity",
              Condition: {
                StringEquals: {
                  "token.actions.githubusercontent.com:aud":
                    "sts.amazonaws.com",
                },
                StringLike: {
                  "token.actions.githubusercontent.com:sub": `repo:${githubUserName}/${githubBackendRepositoryName}:ref:refs/heads/main`,
                },
              },
            },
          ],
        },
        policies: [
          {
            policyName: "SAMDeployPolicy",
            policyDocument: {
              Version: "2012-10-17",
              Statement: [
                {
                  Sid: "CloudFormationStack",
                  Effect: "Allow",
                  Action: [
                    "cloudformation:CreateChangeSet",
                    "cloudformation:CreateStack",
                    "cloudformation:DeleteStack",
                    "cloudformation:DescribeChangeSet",
                    "cloudformation:DescribeStackEvents",
                    "cloudformation:DescribeStacks",
                    "cloudformation:ExecuteChangeSet",
                    "cloudformation:GetTemplateSummary",
                    "cloudformation:GetTemplate",
                    "cloudformation:ListStackResources",
                    "cloudformation:UpdateStack",
                  ],
                  Resource: ["*"],
                },
                {
                  Sid: "S3",
                  Effect: "Allow",
                  Action: ["s3:*"],
                  Resource: ["*"],
                },
                {
                  Sid: "ECRRepository",
                  Effect: "Allow",
                  Action: ["ecr:*"],
                  Resource: ["*"],
                },
                {
                  Sid: "ECRAuthToken",
                  Effect: "Allow",
                  Action: ["ecr:GetAuthorizationToken"],
                  Resource: ["*"],
                },
                {
                  Sid: "Lambda",
                  Effect: "Allow",
                  Action: [
                    "lambda:AddPermission",
                    "lambda:CreateFunction",
                    "lambda:DeleteFunction",
                    "lambda:GetFunction",
                    "lambda:GetFunctionConfiguration",
                    "lambda:ListTags",
                    "lambda:RemovePermission",
                    "lambda:TagResource",
                    "lambda:UntagResource",
                    "lambda:UpdateFunctionCode",
                    "lambda:UpdateFunctionConfiguration",
                  ],
                  Resource: ["*"],
                },
                {
                  Sid: "IAM",
                  Effect: "Allow",
                  Action: [
                    "iam:CreateRole",
                    "iam:AttachRolePolicy",
                    "iam:DeleteRole",
                    "iam:DetachRolePolicy",
                    "iam:GetRole",
                    "iam:TagRole",
                  ],
                  Resource: ["*"],
                },
                {
                  Sid: "IAMPassRole",
                  Effect: "Allow",
                  Action: "iam:PassRole",
                  Resource: "*",
                  Condition: {
                    StringEquals: {
                      "iam:PassedToService": "lambda.amazonaws.com",
                    },
                  },
                },
                {
                  Sid: "APIGateway",
                  Effect: "Allow",
                  Action: [
                    "apigateway:DELETE",
                    "apigateway:GET",
                    "apigateway:PATCH",
                    "apigateway:POST",
                    "apigateway:PUT",
                    "apigateway:TagResource",
                  ],
                  Resource: ["arn:aws:apigateway:*::*"],
                },
                {
                  Sid: "CloudWatchLogGroup",
                  Effect: "Allow",
                  Action: ["logs:*"],
                  Resource: ["*"],
                },
              ],
            },
          },
        ],
      }
    );
    this.taskExecutionRole = new iam.Role(this, "TaskExecutionIAMRole", {
      roleName: "TaskExecutionRole",
      description: "ECS task use role",
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"), // ECSタスクによるロールの引き受けを許可
    });

    // マネージドポリシーを追加
    this.taskExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonECSTaskExecutionRolePolicy"
      )
    );

    // API Gateway の CloudWatch logs 出力用ロールを設定
    const ApiGatewayCloudWatchLogRole = new iam.Role(
      this,
      "ApiGatewayCloudWatchLogRole",
      {
        assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      }
    );
    // apigatewayからlogsにプッシュするためのポリシー
    ApiGatewayCloudWatchLogRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
      )
    );
    new CfnAccount(this, "ApiGatewayAccount", {
      cloudWatchRoleArn: ApiGatewayCloudWatchLogRole.roleArn,
    });
  }
}
