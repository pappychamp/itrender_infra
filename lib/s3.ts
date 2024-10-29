import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { siteDomain } from "./constants";

export class S3Resources extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // S3バケットを作成
    const websiteBucket = new Bucket(this, "WebsiteBucket", {
      bucketName: siteDomain,
      websiteIndexDocument: "index.html", // ホームページのファイル名
      websiteErrorDocument: "error.html", // エラーページのファイル名
      publicReadAccess: true, // 誰でもアクセス可能にする
      blockPublicAccess: {
        blockPublicPolicy: false,
        blockPublicAcls: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      encryption: BucketEncryption.S3_MANAGED, // S3の暗号化を有効化
    });

    const samBucket = new Bucket(this, "SAMBucket", {
      bucketName: "sam-bucket", // バケット名を指定
    });
  }
}
