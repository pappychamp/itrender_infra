import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";

export class ECRResources extends Construct {
  public readonly batchRepository: ecr.IRepository;
  public readonly backendRepository: ecr.IRepository;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // ECRリポジトリの作成
    this.batchRepository = new ecr.Repository(this, "BatchRepository", {
      repositoryName: "batch", // リポジトリ名
      imageScanOnPush: true,
    });
    this.backendRepository = new ecr.Repository(this, "BackendRepository", {
      repositoryName: "backend", // リポジトリ名
      imageScanOnPush: true,
    });
  }
}
