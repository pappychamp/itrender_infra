import { Construct } from "constructs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatch_actions from "aws-cdk-lib/aws-cloudwatch-actions";
import { LambdaResources } from "./lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { SNSResources } from "./sns";

export class CloudWatchResources extends Construct {
  constructor(
    scope: Construct,
    id: string,
    lambdaResources: LambdaResources,
    snsResources: SNSResources
  ) {
    super(scope, id);
    // メトリクスフィルターを設定
    const metricFilter = new logs.MetricFilter(this, "MyMetricFilter", {
      logGroup: lambdaResources.backendLambdaLogGroup,
      filterPattern: logs.FilterPattern.anyTerm(
        "ERROR",
        "Error",
        "WARN",
        "Warn",
        "warn",
        "error"
      ),
      metricNamespace: "MyApp",
      metricName: "WarnErrorCount",
      metricValue: "1",
    });

    // CloudWatch Alarmを作成
    // const alarm = new cloudwatch.Alarm(this, "MyAlarm", {
    //   metric: metricFilter.metric(),
    //   threshold: 1,
    //   evaluationPeriods: 1,
    //   alarmDescription: "Alarm when ERROR or WARN appears in logs",
    // });

    // // アラームアクションとしてSNSトピックを設定
    // alarm.addAlarmAction(
    //   new cloudwatch_actions.SnsAction(snsResources.backendLoggroupSNSTopic)
    // );
  }
}
