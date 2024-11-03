import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins";
import { S3Resources } from "./s3";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import { siteDomain } from "./constants";

export class CloudFrontResources extends Construct {
  constructor(scope: Construct, id: string, s3Resources: S3Resources) {
    super(scope, id);

    const certificateArn = ssm.StringParameter.valueForStringParameter(
      this,
      "/itrender/CertificateArn"
    );
    const certificate = certificatemanager.Certificate.fromCertificateArn(
      this,
      "ExistingCertificate",
      certificateArn
    );

    // CloudFront ディストリビューションの作成
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      domainNames: [siteDomain],
      defaultRootObject: "index.html",
      certificate: certificate,
      geoRestriction: cloudfront.GeoRestriction.allowlist("JP"),
      defaultBehavior: {
        origin: cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
          s3Resources.websiteBucket
        ),
      },
    });
  }
}
