const { aws: awsEnv } = require("../../../loadenv");

const logger = require("../logger");
// Load the AWS-SDK and s3
const {getSignedUrl} = require("@aws-sdk/s3-request-presigner")
const {PutObjectCommand,S3} = require("@aws-sdk/client-s3")
const { SES } = require("@aws-sdk/client-ses");

const s3 = new S3({
  apiVersion: "2006-03-01",
  region: 'ap-northeast-2'
  });
const ses = new SES({ apiVersion: "2010-12-01",region: 'ap-northeast-2' });

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
module.exports.getUploadPUrlPut = async (
  filePath,
  contentType = "image/png"
) => {
  const presignedUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: awsEnv.s3BucketName,
      Key: filePath,
      ContentType: contentType,
    }),
    {
      expiresIn: 60,
    }
  );
  return presignedUrl;
};

// function to generate signed-url for upload(POST)
module.exports.getUploadPUrlPost = async (filePath, contentType) => {
  try {
    const presignedUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: awsEnv.s3BucketName,
        Key: filePath,
        contentType: contentType,
      }),
      {
        expiresIn: 60,
      }
    );
    return presignedUrl;
  } catch (e) {
    return e;
  }
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
