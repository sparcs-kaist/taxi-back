const { aws: awsEnv, slackWebhookUrl: slackUrl } = require("../../../loadenv");
const axios = require("axios");
const logger = require("../logger");
// Load the AWS-SDK and s3
const AWS = require("aws-sdk");
AWS.config.update({
  region: "ap-northeast-2",
  signatureVersion: "v4",
});

const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
const ses = new AWS.SES({ apiVersion: "2010-12-01" });

// function to list Object
module.exports.getList = (directoryPath, cb) => {
  s3.listObjects(
    {
      Bucket: awsEnv.s3BucketName,
      Prefix: directoryPath,
    },
    (err, data) => {
      cb(err, data);
    }
  );
};

// function to generate signed-url for upload(PUT)
module.exports.getUploadPUrlPut = (filePath, contentType = "image/png") => {
  const presignedUrl = s3.getSignedUrl("putObject", {
    Bucket: awsEnv.s3BucketName,
    Key: filePath,
    ContentType: contentType,
    Expires: 60, // 1 min
  });
  return presignedUrl;
};

// function to generate signed-url for upload(POST)
module.exports.getUploadPUrlPost = (filePath, contentType, cb) => {
  s3.createPresignedPost(
    {
      Bucket: awsEnv.s3BucketName,
      Expires: 60, // 1 min
      Conditions: [
        { key: filePath },
        ["eq", "$Content-Type", contentType],
        ["content-length-range", 1, 2 * 1024 * 1024], // Maximum file size is 2MB
      ],
    },
    (err, data) => {
      cb(err, data);
    }
  );
};

// function to delete object
module.exports.deleteObject = (filePath, cb) => {
  s3.deleteObject(
    {
      Bucket: awsEnv.s3BucketName,
      Key: filePath,
    },
    (err, data) => {
      cb(err, data);
    }
  );
};

// function to check exist of Object
module.exports.foundObject = (filePath, cb) => {
  s3.headObject(
    {
      Bucket: awsEnv.s3BucketName,
      Key: filePath,
    },
    (err, data) => {
      cb(err, data);
    }
  );
};

// function to return full URL of the object
module.exports.getS3Url = (filePath) => {
  return `${awsEnv.s3Url}${filePath}`;
};

module.exports.sendReportEmail = (reportUser, reportedEmail, report, html) => {
  const reportTypeMap = {
    "no-settlement": "정산을 하지 않음",
    "no-show": "택시에 동승하지 않음",
    "etc-reason": "기타 사유"
  }

  const params = {
    Destination: {
      ToAddresses: [reportedEmail],
    },
    Message: {
      Body: {
        Html: {
          Data: html
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: `[SPARCS TAXI] 신고가 접수되었습니다 (사유: ${reportTypeMap[report.type]})`,
      },
    },
    Source: "taxi.sparcs@gmail.com",
  };

  ses.sendEmail(params, (err, data) => {
    if (err) {
      logger.info("Fail to send email", err);
    } else {
      const data = {
        'text' : 
        `${reportUser}님으로부터 신고가 접수되었습니다.

        신고자 ID: ${report.creatorId}
        신고 ID: ${report.reportedId}
        사유: ${reportTypeMap[report.type]}
        기타: ${report.etcDetail}
        `};
      const config = {"Content-Type": 'application/json'};
      
      // axios.post(slackUrl, data, config).then(res => {
      //   logger.info("Slack webhook sent successfully")
      // }).catch(err => {
      //   logger.info("Fail to send slack webhook", err)
      // })

      logger.info("Email sent successfully");
    }
  });
};
