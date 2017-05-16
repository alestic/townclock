var AWS = require('aws-sdk');

var support = 'TBD';
var reference = 'http://townclock.io';
var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

var chime = function(sns_topic_arn, region, event_time, uuid, callback) {
    var sns        = new AWS.SNS({
      region: region
    });
    var chime_time = new Date(event_time);
    var chime_yyyy = "" + chime_time.getFullYear();
    var chime_mm   = ('0' + (1 + chime_time.getMonth())).slice (-2);
    var chime_dd   = ('0' + chime_time.getDate()).slice (-2);
    var chime_hh   = ('0' + chime_time.getHours()).slice (-2);
    var chime_mi   = ('0' + chime_time.getMinutes()).slice (-2);
    var chime_ss   = ('0' + chime_time.getSeconds()).slice (-2);
    var chime_day  = days[chime_time.getDay()];
    var timestamp  = chime_yyyy + '-' + chime_mm + '-' + chime_dd +
                 ' ' + chime_hh + ':' + chime_mi + ' UTC';
    var subject    = "[Unreliable Town Clock] chime: " + timestamp;

    var message    = {
      "source": "townclock.chime",
      "type": "chime",
      "timestamp": timestamp,
      "year": chime_yyyy,
      "month": chime_mm,
      "day": chime_dd,
      "hour": chime_hh,
      "minute": chime_mi,
      "day_of_week": chime_day,
      "unique_id": uuid,
      "region": region,
      "sns_topic_arn": sns_topic_arn,
      "reference": reference,
      "support": support,
      "disclaimer": "UNRELIABLE SERVICE"
    };
    var message_payload = JSON.stringify(message, null, 2);

    var params = {
        TopicArn: sns_topic_arn,
        Subject: subject,
        Message: message_payload
    };
    console.log("params:", params);

    sns.publish(params, function(err, data) {
        if (err) {
            callback(err, err.stack);
        } else {
            console.log("publish response:", data);
            callback(null, data);
        }
    });
};

var sns_topic_arn = null;

exports.handler = function(event, context) {
    console.log("context:", JSON.stringify(context, null, 4));
    console.log("event:", JSON.stringify(event, null, 4));
    if ( sns_topic_arn !== null ) {
        chime(sns_topic_arn, event.region, event.time, event.id, context.done);
        return;
    }

    var lambda = new AWS.Lambda();
    lambda.getFunctionConfiguration(
        {FunctionName: context.functionName},
        function(err, data) {
            if (err) {
                context.done(err, data);
                return;
            }
            sns_topic_arn = data.Description.trim();
            chime(sns_topic_arn, event.region, event.time, event.id, context.done);
        }
    );
};


/*
// debug
exports.handler({
    "id": "a32208f0-2c2f-43d9-8941-6c75842d3760",
    "detail-type": "Scheduled Event",
    "source": "aws.events",
    "account": "063491364108",
    "time": "2015-09-23T01:45:00Z",
    "region": "us-east-1",
    "resources": [
        "arn:aws:events:us-east-1:063491364108:rule/test-20150922a"
    ],
    "tags": [],
    "detail": {}
}, {
    "functionName": "lambda-echo",
    "done": function(err, data) {
        console.log("done: ", err, data);
    }
});
*/
