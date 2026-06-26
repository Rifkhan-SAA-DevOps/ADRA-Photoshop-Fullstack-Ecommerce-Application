import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  AWS_REGION,
  s3Client,
  S3_BUCKET,
  S3_PUBLIC_URL,
} from "../config/s3.js";

export function getS3KeyFromUrl(url = "") {
  if (!url || !S3_BUCKET) return "";

  try {
    const cleanUrl = String(url).trim();
    const cleanPublicUrl = String(S3_PUBLIC_URL || "").replace(/\/$/, "");

    if (cleanPublicUrl && cleanUrl.startsWith(`${cleanPublicUrl}/`)) {
      return cleanUrl.replace(`${cleanPublicUrl}/`, "");
    }

    const parsedUrl = new URL(cleanUrl);
    const hostname = parsedUrl.hostname;
    const pathname = parsedUrl.pathname.replace(/^\/+/, "");

    const virtualHost1 = `${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
    const virtualHost2 = `${S3_BUCKET}.s3.amazonaws.com`;

    if (hostname === virtualHost1 || hostname === virtualHost2) {
      return pathname;
    }

    const pathStyleHost1 = `s3.${AWS_REGION}.amazonaws.com`;
    const pathStyleHost2 = "s3.amazonaws.com";

    if (
      (hostname === pathStyleHost1 || hostname === pathStyleHost2) &&
      pathname.startsWith(`${S3_BUCKET}/`)
    ) {
      return pathname.replace(`${S3_BUCKET}/`, "");
    }

    return "";
  } catch {
    return "";
  }
}

export async function deleteS3FileByUrl(url = "") {
  const key = getS3KeyFromUrl(url);

  if (!S3_BUCKET || !key) {
    return;
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }),
  );
}