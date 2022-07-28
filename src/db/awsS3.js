const security = require("../../security");

// Load the AWS-SDK and s3
const AWS = require("aws-sdk");
AWS.config.update({
  region: "ap-northeast-2",
  signatureVersion: "v4",
});
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

// function to list Object
module.exports.getList = (directoryPath, cb) => {
  s3.listObjects(
    {
      Bucket: security.aws.s3BucketName,
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
    Bucket: security.aws.s3BucketName,
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
      Bucket: security.aws.s3BucketName,
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
      Bucket: security.aws.s3BucketName,
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
      Bucket: security.aws.s3BucketName,
      Key: filePath,
    },
    (err, data) => {
      cb(err, data);
    }
  );
};
