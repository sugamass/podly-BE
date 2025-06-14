const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  CreateTableCommand,
  DynamoDBDocumentClient,
} = require("@aws-sdk/lib-dynamodb");

// ローカル環境のDynamoDB設定
const dynamoConfig = {
  region: "ap-northeast-1",
  endpoint: "http://localhost:8000",
  credentials: {
    accessKeyId: "local",
    secretAccessKey: "local",
  },
};

const dynamoClient = new DynamoDBClient(dynamoConfig);
const client = DynamoDBDocumentClient.from(dynamoClient);

// ユーザーテーブルの作成
async function createUsersTable() {
  const tableName = "pods-backend-dev-users";

  const params = {
    TableName: tableName,
    KeySchema: [
      {
        AttributeName: "id",
        KeyType: "HASH",
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: "id",
        AttributeType: "S",
      },
      {
        AttributeName: "email",
        AttributeType: "S",
      },
      {
        AttributeName: "username",
        AttributeType: "S",
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "email-index",
        KeySchema: [
          {
            AttributeName: "email",
            KeyType: "HASH",
          },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: "username-index",
        KeySchema: [
          {
            AttributeName: "username",
            KeyType: "HASH",
          },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    const command = new CreateTableCommand(params);
    await dynamoClient.send(command);
    console.log(`✅ テーブル '${tableName}' を作成しました`);
  } catch (error) {
    if (error.name === "ResourceInUseException") {
      console.log(`⚠️  テーブル '${tableName}' は既に存在します`);
    } else {
      console.error(`❌ テーブル '${tableName}' の作成に失敗しました:`, error);
      throw error;
    }
  }
}

// メイン関数
async function main() {
  console.log("🚀 DynamoDB Localにテーブルを作成中...");

  try {
    await createUsersTable();
    console.log("✨ すべてのテーブルの作成が完了しました");
  } catch (error) {
    console.error("❌ テーブル作成中にエラーが発生しました:", error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  main();
}

module.exports = { createUsersTable };
