import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class SecurityGroupResources extends Construct {
  constructor(scope: Construct, id: string, vpc: ec2.Vpc) {
    super(scope, id);

    // ECRリポジトリの作成
    const TestSG = new ec2.SecurityGroup(this, "TestSG", {
      vpc,
      description: "test sg",
    });

    TestSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP traffic"
    );
  }
}
