import dotenv from "dotenv";
import {
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { dynamoClient, TABLES } from "../config/db.js";

dotenv.config();

const COMMON_TAGS = [
  {
    Key: "Project",
    Value: "ADRA Photography Website",
  },
  {
    Key: "Environment",
    Value: process.env.NODE_ENV || "production",
  },
];

async function tableExists(TableName) {
  try {
    await dynamoClient.send(new DescribeTableCommand({ TableName }));
    return true;
  } catch (error) {
    if (error.name === "ResourceNotFoundException") return false;
    throw error;
  }
}

function gsi({
  name,
  partitionKey,
  sortKey,
  projectionType = "ALL",
}) {
  return {
    IndexName: name,
    KeySchema: [
      {
        AttributeName: partitionKey,
        KeyType: "HASH",
      },
      ...(sortKey
        ? [
            {
              AttributeName: sortKey,
              KeyType: "RANGE",
            },
          ]
        : []),
    ],
    Projection: {
      ProjectionType: projectionType,
    },
  };
}

async function createTable({
  TableName,
  AttributeDefinitions,
  KeySchema,
  GlobalSecondaryIndexes = [],
}) {
  if (!TableName) {
    throw new Error(
      "TableName is missing. Check TABLES object in server/src/config/db.js",
    );
  }

  const exists = await tableExists(TableName);

  if (exists) {
    console.log(`Already exists: ${TableName}`);
    return;
  }

  console.log(`Creating: ${TableName}`);

  const tableConfig = {
    TableName,
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions,
    KeySchema,
    Tags: COMMON_TAGS,
  };

  if (GlobalSecondaryIndexes.length > 0) {
    tableConfig.GlobalSecondaryIndexes = GlobalSecondaryIndexes;
  }

  await dynamoClient.send(new CreateTableCommand(tableConfig));

  await waitUntilTableExists(
    {
      client: dynamoClient,
      maxWaitTime: 120,
    },
    {
      TableName,
    },
  );

  console.log(`Created: ${TableName}`);
}

async function main() {
  await createTable({
    TableName: TABLES.admins,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      gsi({
        name: "email-index",
        partitionKey: "email",
      }),
    ],
  });

  await createTable({
    TableName: TABLES.products,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "slug", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
      { AttributeName: "category_status", AttributeType: "S" },
      { AttributeName: "created_at", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      gsi({
        name: "slug-index",
        partitionKey: "slug",
      }),
      gsi({
        name: "status-created_at-index",
        partitionKey: "status",
        sortKey: "created_at",
      }),
      gsi({
        name: "category_status-created_at-index",
        partitionKey: "category_status",
        sortKey: "created_at",
      }),
    ],
  });

  await createTable({
    TableName: TABLES.services,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "slug", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
      { AttributeName: "category_status", AttributeType: "S" },
      { AttributeName: "created_at", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      gsi({
        name: "slug-index",
        partitionKey: "slug",
      }),
      gsi({
        name: "status-created_at-index",
        partitionKey: "status",
        sortKey: "created_at",
      }),
      gsi({
        name: "category_status-created_at-index",
        partitionKey: "category_status",
        sortKey: "created_at",
      }),
    ],
  });

  await createTable({
    TableName: TABLES.events,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "slug", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
      { AttributeName: "category_status", AttributeType: "S" },
      { AttributeName: "event_date", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      gsi({
        name: "slug-index",
        partitionKey: "slug",
      }),
      gsi({
        name: "status-event_date-index",
        partitionKey: "status",
        sortKey: "event_date",
      }),
      gsi({
        name: "category_status-event_date-index",
        partitionKey: "category_status",
        sortKey: "event_date",
      }),
    ],
  });

  await createTable({
    TableName: TABLES.productImages,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "product_id", AttributeType: "S" },
      { AttributeName: "created_at", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      gsi({
        name: "resource-created_at-index",
        partitionKey: "product_id",
        sortKey: "created_at",
      }),
    ],
  });

  await createTable({
    TableName: TABLES.serviceImages,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "service_id", AttributeType: "S" },
      { AttributeName: "created_at", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      gsi({
        name: "resource-created_at-index",
        partitionKey: "service_id",
        sortKey: "created_at",
      }),
    ],
  });

  await createTable({
    TableName: TABLES.eventImages,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "event_id", AttributeType: "S" },
      { AttributeName: "created_at", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      gsi({
        name: "resource-created_at-index",
        partitionKey: "event_id",
        sortKey: "created_at",
      }),
    ],
  });

  await createTable({
    TableName: TABLES.bookings,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
      { AttributeName: "event_id", AttributeType: "S" },
      { AttributeName: "created_at", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      gsi({
        name: "status-created_at-index",
        partitionKey: "status",
        sortKey: "created_at",
      }),
      gsi({
        name: "event_id-created_at-index",
        partitionKey: "event_id",
        sortKey: "created_at",
      }),
    ],
  });

  await createTable({
    TableName: TABLES.contacts,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
      { AttributeName: "created_at", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      gsi({
        name: "status-created_at-index",
        partitionKey: "status",
        sortKey: "created_at",
      }),
    ],
  });

  await createTable({
    TableName: TABLES.reviews,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "product_id", AttributeType: "S" },
      { AttributeName: "approval_status", AttributeType: "S" },
      { AttributeName: "created_at", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      gsi({
        name: "product_id-created_at-index",
        partitionKey: "product_id",
        sortKey: "created_at",
      }),
      gsi({
        name: "approval_status-created_at-index",
        partitionKey: "approval_status",
        sortKey: "created_at",
      }),
    ],
  });

 await createTable({
  TableName: TABLES.reviewImages,
  AttributeDefinitions: [
    { AttributeName: "id", AttributeType: "S" },
    { AttributeName: "review_id", AttributeType: "S" },
    { AttributeName: "created_at", AttributeType: "S" },
  ],
  KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
  GlobalSecondaryIndexes: [
    gsi({
      name: "review_id-created_at-index",
      partitionKey: "review_id",
      sortKey: "created_at",
    }),
  ],
});

  await createTable({
    TableName: TABLES.customers,
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" },
      { AttributeName: "phone", AttributeType: "S" },
    ],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    GlobalSecondaryIndexes: [
      gsi({
        name: "email-index",
        partitionKey: "email",
      }),
      gsi({
        name: "phone-index",
        partitionKey: "phone",
      }),
    ],
  });

  await createTable({
  TableName: TABLES.heroImageGrid,
  AttributeDefinitions: [
    { AttributeName: "id", AttributeType: "S" },
  ],
  KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
});

  await createTable({
    TableName: TABLES.settings,
    AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
  });

  console.log("All DynamoDB tables are ready.");
}

main().catch((error) => {
  console.error("Failed to create DynamoDB tables:");
  console.error(error);
  process.exit(1);
});



