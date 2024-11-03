import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins";
import { S3Resources } from "./s3";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import { siteDomain } from "./constants";
import { ApiGatewayResources } from "./apigateway";
import * as cdk from "aws-cdk-lib";

export class CloudFrontResources extends Construct {
  constructor(
    scope: Construct,
    id: string,
    s3Resources: S3Resources,
    apigatewayResources: ApiGatewayResources
  ) {
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

    // apigatewayのドメイン部分の抽出
    const apiEndPointUrlWithoutProtocol = cdk.Fn.select(
      1,
      cdk.Fn.split("://", apigatewayResources.BackendApiEndpoint)
    );
    const apiEndPointDomainName = cdk.Fn.select(
      0,
      cdk.Fn.split("/", apiEndPointUrlWithoutProtocol)
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
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        "/api/*": {
          origin: new cloudfront_origins.HttpOrigin(apiEndPointDomainName, {}),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
    });
  }
}
