import {
  getResourceImages,
  normalizeImages,
  replaceResourceImages,
} from "./resourceImages.js";
import { deleteS3FileByUrl } from "./s3Files.js";

export async function deleteUnusedS3Urls({ oldUrls = [], newUrls = [] }) {
  const oldSet = new Set(oldUrls.filter(Boolean));
  const newSet = new Set(newUrls.filter(Boolean));

  const removedUrls = [...oldSet].filter((url) => !newSet.has(url));

  for (const url of removedUrls) {
    try {
      await deleteS3FileByUrl(url);
    } catch (error) {
      console.error("Failed to delete old S3 image:", url, error.message);
    }
  }

  return removedUrls;
}

export async function syncResourceImages({
  table,
  foreignKey,
  resourceId,
  images = [],
  protectedUrls = [],
}) {
  const oldImages = await getResourceImages({
    table,
    foreignKey,
    resourceId,
  });

  const cleanImages = normalizeImages(images);

  await replaceResourceImages({
    table,
    foreignKey,
    resourceId,
    images: cleanImages,
  });

  const oldUrls = oldImages.map((image) => image.image_url).filter(Boolean);

  const newUrls = [
    ...cleanImages.map((image) => image.image_url).filter(Boolean),
    ...protectedUrls.filter(Boolean),
  ];

  const removedUrls = await deleteUnusedS3Urls({
    oldUrls,
    newUrls,
  });

  return {
    oldImages,
    cleanImages,
    removedUrls,
  };
}