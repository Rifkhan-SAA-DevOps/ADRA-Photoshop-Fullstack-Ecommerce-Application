import {
  TABLES,
  deleteItem,
  makeId,
  now,
  putItem,
  queryByIndex,
} from "../config/db.js";

export function normalizeImages(images = []) {
  if (!Array.isArray(images)) return [];

  return images
    .map((image) => {
      if (typeof image === "string") {
        return {
          image_url: image.trim(),
          caption: "",
        };
      }

      return {
        image_url: String(image.image_url || image.url || "").trim(),
        caption: String(image.caption || "").trim(),
      };
    })
    .filter((image) => image.image_url);
}

const RESOURCE_CREATED_AT_INDEX = "resource-created_at-index";

export async function getResourceImages({ table, foreignKey, resourceId }) {
  if (!table || !foreignKey || !resourceId) return [];

  const rows = await queryByIndex(table, {
    IndexName: RESOURCE_CREATED_AT_INDEX,
    KeyConditionExpression: "#resourceId = :resourceId",
    ExpressionAttributeNames: {
      "#resourceId": foreignKey,
    },
    ExpressionAttributeValues: {
      ":resourceId": String(resourceId),
    },
    ScanIndexForward: false,
  });
  
  return rows;
}

export async function replaceResourceImages({
  table,
  foreignKey,
  resourceId,
  images,
}) {
  const cleanImages = normalizeImages(images);

  const existingImages = await getResourceImages({
    table,
    foreignKey,
    resourceId,
  });

  for (const image of existingImages) {
    await deleteItem(table, image.id);
  }

  for (const image of cleanImages) {
    await putItem(table, {
      id: makeId("img"),
      [foreignKey]: resourceId,
      image_url: image.image_url,
      caption: image.caption || "",
      created_at: now(),
    });
  }
}

export const IMAGE_TABLES = {
  services: {
    table: TABLES.serviceImages,
    foreignKey: "service_id",
  },
  products: {
    table: TABLES.productImages,
    foreignKey: "product_id",
  },
  events: {
    table: TABLES.eventImages,
    foreignKey: "event_id",
  },
};