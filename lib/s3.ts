import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { siteDomain } from "./constants";
export class S3Resources extends Construct {
  public readonly websiteBucket: Bucket;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // S3バケットを作成
    this.websiteBucket = new Bucket(this, "WebsiteBucket", {
      bucketName: siteDomain,
      blockPublicAccess: {
        blockPublicPolicy: true,
        blockPublicAcls: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
    });

    const samBucket = new Bucket(this, "SAMBucket", {
      bucketName: "itrender-sam-bucket", // バケット名を指定
    });
  }
}
