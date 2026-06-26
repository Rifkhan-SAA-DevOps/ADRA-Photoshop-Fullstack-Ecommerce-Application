import dotenv from "dotenv";
import { randomUUID } from "crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

dotenv.config();

const region = process.env.AWS_REGION || "ap-south-1";

export const dynamoClient = new DynamoDBClient({
  region,
});

export const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

const prefix = process.env.DYNAMODB_TABLE_PREFIX || "photography_shop";

export const TABLES = {
 
  admins: `${prefix}_admins`,
  services: `${prefix}_services`,
  products: `${prefix}_products`,
  events: `${prefix}_events`,
  bookings: `${prefix}_bookings`,
  contacts: `${prefix}_contacts`,
  reviews: `${prefix}_reviews`,
  customers: `${prefix}_customers`,
  settings: `${prefix}_settings`,

  serviceImages: `${prefix}_service_images`,
  productImages: `${prefix}_product_images`,
  eventImages: `${prefix}_event_images`,
  reviewImages: `${prefix}_review_images`,

};

export function makeId(prefixName = "") {
  const id = randomUUID();

  if (!prefixName) return id;

  return `${prefixName}_${id}`;
}

export function now() {
  return new Date().toISOString();
}

export function cleanItem(item = {}) {
  return Object.fromEntries(
    Object.entries(item).filter(([, value]) => value !== undefined),
  );
}

export async function getItem(tableName, id) {
  const res = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { id },
    }),
  );

  return res.Item || null;
}

export async function putItem(tableName, item) {
  const cleanData = cleanItem(item);

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: cleanData,
    }),
  );

  return cleanData;
}

export async function deleteItem(tableName, id) {
  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { id },
    }),
  );
}

export async function scanAll(tableName, options = {}) {
  const items = [];
  let ExclusiveStartKey;

  do {
    const res = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey,
        ...options,
      }),
    );

    items.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

export async function queryByIndex(tableName, options = {}) {
  const items = [];
  let ExclusiveStartKey;

  do {
    const res = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        ExclusiveStartKey,
        ...options,
      }),
    );

    items.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

export async function updateItem(tableName, id, data = {}) {
  const cleanData = cleanItem(data);
  const entries = Object.entries(cleanData);

  if (!entries.length) {
    return getItem(tableName, id);
  }

  const ExpressionAttributeNames = {};
  const ExpressionAttributeValues = {};
  const updateParts = [];

  entries.forEach(([key, value]) => {
    if (key === "id") return;

    ExpressionAttributeNames[`#${key}`] = key;
    ExpressionAttributeValues[`:${key}`] = value;
    updateParts.push(`#${key} = :${key}`);
  });

  const res = await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: `SET ${updateParts.join(", ")}`,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: "ALL_NEW",
    }),
  );

  return res.Attributes || null;
}

// Temporary helper.
// Old SQL routes must be converted one by one.
// If any old route still calls query(), this error will show which file needs update.
export async function query() {
  throw new Error(
    "SQL query() is removed. Convert this route to DynamoDB using docClient, TABLES, scanAll, getItem, putItem, updateItem, or deleteItem.",
  );
}