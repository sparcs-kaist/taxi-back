import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  PutObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { aws as awsEnv } from "@/loadenv";

const s3 = new S3Client({
  region: "ap-northeast-2",
  credentials: {
    accessKeyId: awsEnv.accessKeyId,
    secretAccessKey: awsEnv.secretAccessKey,
  },
});

// function to generate signed-url for upload(POST)
export const getUploadPUrlPost = async (
  filePath: string,
  contentType: string
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

// function to check exist of Object
export const foundObject = async (filePath: string) => {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: awsEnv.s3BucketName,
        Key: filePath,
      })
    );
    return true;
  } catch (err) {
    if (err instanceof Error && err.name === "NotFound") {
      return false;
    }
    throw err;
  }
};

// function to return full URL of the object
export const getS3Url = (filePath: string) => {
  const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `${awsEnv.s3Url}${normalizedPath}`;
};

// function to resolve S3 URL or return original URL
export function resolveS3Url(pathOrUrl: string): string;
export function resolveS3Url(pathOrUrl?: string | null): string | undefined;
export function resolveS3Url(pathOrUrl?: string | null) {
  if (pathOrUrl == null) return undefined;
  if (pathOrUrl === "") return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return getS3Url(pathOrUrl);
}
