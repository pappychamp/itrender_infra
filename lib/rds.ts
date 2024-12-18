import { Construct } from "constructs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export class RDSResources extends Construct {
  public readonly newDBSecret: secretsmanager.Secret;
  constructor(scope: Construct, id: string, vpc: ec2.Vpc) {
    super(scope, id);
    // Parameter StoreからDB名とユーザ名とパスワードを取得
    const dbName = ssm.StringParameter.fromStringParameterName(
      this,
      "DBName",
      "/itrender/POSTGRES_DB"
    );

    this.newDBSecret = new secretsmanager.Secret(this, "NewDBSecretManager", {
      secretName: "newDatabaseSecret", // シークレットの名前
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "itrenderdbUser" }), // 自動生成されたユーザー名を設定
        generateStringKey: "password", // パスワードを生成する
        excludePunctuation: true, // 記号を含めないオプション
      },
    });

    // RDS PostgreSQL インスタンスを作成
    const nweRDSInstance = new rds.DatabaseInstance(this, "NewRDSInstance", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_3,
      }),
      vpc,
      credentials: rds.Credentials.fromSecret(this.newDBSecret),
      databaseName: dbName.stringValue, // データベース名
      multiAz: false, // マルチアベイラビリティゾーン
      allocatedStorage: 20, // 20GBのストレージ
      maxAllocatedStorage: 100,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // プライベートサブネットにデプロイ
      },
      publiclyAccessible: false, // パブリックアクセスを無効化
      backupRetention: cdk.Duration.days(7), // バックアップの保持期間 (7日)
      removalPolicy: cdk.RemovalPolicy.DESTROY, // スタック削除時にデータベースを削除
    });

    // RDS インスタンスのセキュリティグループに対して、インバウンドルールを追加
    nweRDSInstance.connections.allowFromAnyIpv4(
      ec2.Port.tcp(5432),
      "Allow PostgreSQL access"
    );
  }
}
