import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  githubUserName,
  githubBatchRepositoryName,
  githubFrontendRepositoryName,
} from "./constants";
import { Stack } from "aws-cdk-lib";
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
  }
}
