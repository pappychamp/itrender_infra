import { Construct } from "constructs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";
import * as ssm from "aws-cdk-lib/aws-ssm";

export class RDSResources extends Construct {
  constructor(scope: Construct, id: string, vpc: ec2.Vpc) {
    super(scope, id);
    // Parameter StoreからDB名とユーザ名とパスワードを取得
    const dbName = ssm.StringParameter.fromStringParameterName(
      this,
      "DBName",
      "/itrender/POSTGRES_DB"
    );
    const dbUsername = ssm.StringParameter.fromStringParameterName(
      this,
      "DBUsername",
      "/itrender/POSTGRES_USER"
    );
    const dbPassword = cdk.SecretValue.ssmSecure("/itrender/POSTGRES_PASSWORD");

    // RDS PostgreSQL インスタンスを作成
    const rdsInstance = new rds.DatabaseInstance(this, "RDSInstance", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_3,
      }),
      vpc,
      credentials: rds.Credentials.fromUsername(dbUsername.stringValue, {
        password: dbPassword,
      }),
      multiAz: false, // マルチアベイラビリティゾーン
      allocatedStorage: 100, // 100GBのストレージ
      maxAllocatedStorage: 500,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // プライベートサブネットにデプロイ
      },
      databaseName: dbName.stringValue, // データベース名
      publiclyAccessible: false, // パブリックアクセスを無効化
      backupRetention: cdk.Duration.days(7), // バックアップの保持期間 (7日)
      removalPolicy: cdk.RemovalPolicy.DESTROY, // スタック削除時にデータベースを削除
    });

    // RDSエンドポイントをParameter Storeに保存
    new ssm.StringParameter(this, "RdsEndpointParameter", {
      parameterName: "/itrender/HOST_NAME",
      stringValue: rdsInstance.instanceEndpoint.hostname,
      description: "RDS Instance Endpoint",
    });

    // RDS インスタンスのセキュリティグループに対して、インバウンドルールを追加
    rdsInstance.connections.allowFromAnyIpv4(
      ec2.Port.tcp(5432),
      "Allow PostgreSQL access"
    );
  }
}