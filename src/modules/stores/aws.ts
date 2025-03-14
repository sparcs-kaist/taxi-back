import AWS from "aws-sdk";
import { aws as awsEnv } from "@/loadenv";

AWS.config.update({
  region: "ap-northeast-2",
  signatureVersion: "v4",
});

const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
const ses = new AWS.SES({ apiVersion: "2010-12-01" });

// function to list Object
export const getList = (
  directoryPath: string,
  cb: (err: AWS.AWSError, data: AWS.S3.ListObjectsOutput) => void
) => {
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
export const getUploadPUrlPut = (
  filePath: string,
  contentType: string = "image/png"
) => {
  const presignedUrl = s3.getSignedUrl("putObject", {
    Bucket: awsEnv.s3BucketName,
    Key: filePath,
    ContentType: contentType,
    Expires: 60, // 1 min
  });
  return presignedUrl;
};

// function to generate signed-url for upload(POST)
export const getUploadPUrlPost = (
  filePath: string,
  contentType: string,
  cb: (err: Error, data: AWS.S3.PresignedPost) => void
) => {
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
export const deleteObject = (
  filePath: string,
  cb: (err: AWS.AWSError, data: AWS.S3.DeleteObjectOutput) => void
) => {
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
export const foundObject = (
  filePath: string,
  cb: (err: AWS.AWSError, data: AWS.S3.HeadObjectOutput) => void
) => {
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
export const getS3Url = (filePath: string) => {
  return `${awsEnv.s3Url}${filePath}`;
};
