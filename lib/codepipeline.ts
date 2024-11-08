import { Construct } from "constructs";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import { ECRResources } from "./ecr";
import { LambdaResources } from "./lambda";
import * as iam from "aws-cdk-lib/aws-iam";

export class CodePipelineResources extends Construct {
  public readonly backendPipeline: codepipeline.Pipeline;
  constructor(
    scope: Construct,
    id: string,
    ecrResources: ECRResources,
    lambdaResources: LambdaResources,
    region: string,
    accountId: string
  ) {
    super(scope, id);

    const sourceOutput = new codepipeline.Artifact();

    // backendPipelineで使用するbuildプロジェクト
    const backendLambdaUpdateProject = new codebuild.PipelineProject(
      this,
      `BackendLambdaUpdateProject`,
      {
        buildSpec: codebuild.BuildSpec.fromObject({
          version: "0.2",
          phases: {
            build: {
              commands: [
                // imageのハッシュを取得
                `imageDigest=$(aws ecr describe-images --repository-name ${ecrResources.backendRepository.repositoryName} | jq -r '.imageDetails[] | select(.imageTags == ["latest"]) | .imageDigest')`,
                `echo "Image Digest: $imageDigest"`,
                // lambdaを更新
                `aws lambda update-function-code --function-name ${lambdaResources.lambdaFunction.functionName} --image-uri ${ecrResources.backendRepository.repositoryUri}@$imageDigest`,
              ],
            },
          },
        }),
        environment: {
          buildImage:
            codebuild.LinuxLambdaBuildImage.AMAZON_LINUX_2023_CORRETTO_21,
        },
      }
    );

    // CodeBuildプロジェクトにECRのイメージ詳細取得とpull権限とLambda更新権限を付与
    ecrResources.backendRepository.grantPull(backendLambdaUpdateProject);
    ecrResources.backendRepository.grantRead(backendLambdaUpdateProject);
    backendLambdaUpdateProject.addToRolePolicy(
      new iam.PolicyStatement({
        resources: [lambdaResources.lambdaFunction.functionArn],
        actions: ["lambda:UpdateFunctionCode"],
      })
    );

    // BackendLambdaのイメージを更新するパイプライン
    this.backendPipeline = new codepipeline.Pipeline(this, "BackendPipeline", {
      pipelineName: "BackendPipeline",
      crossAccountKeys: false,
      stages: [
        {
          stageName: "Source",
          actions: [
            new codepipeline_actions.EcrSourceAction({
              actionName: "ECR-Pull",
              repository: ecrResources.backendRepository,
              imageTag: "latest",
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: "Build",
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: "Lambda-Update",
              project: backendLambdaUpdateProject,
              input: sourceOutput,
            }),
          ],
        },
      ],
    });
  }
}
