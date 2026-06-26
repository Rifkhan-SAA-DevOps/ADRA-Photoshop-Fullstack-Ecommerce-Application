import dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";

dotenv.config();

export const AWS_REGION = process.env.AWS_REGION || "ap-south-1";

export const S3_BUCKET = process.env.AWS_S3_BUCKET;

export const S3_PUBLIC_URL =
  process.env.AWS_S3_PUBLIC_URL ||
  `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;

export const s3Client = new S3Client({
  region: AWS_REGION,
});


