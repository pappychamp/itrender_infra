import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class ECRResources extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    // ECRリポジトリの作成
    const batchRepository = new ecr.Repository(this, 'BatchRepository', {
        repositoryName: 'batch', // リポジトリ名
        imageScanOnPush:true,
      });
    const backendRepository = new ecr.Repository(this, 'BackendRepository', {
        repositoryName: 'backend', // リポジトリ名
        imageScanOnPush:true,
      });
  }
}
