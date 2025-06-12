const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: 'ap-northeast-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  },
});

async function createUsersTable() {
  const params = {
    TableName: 'pods-backend-dev-users',
    KeySchema: [
      {
        AttributeName: 'id',
        KeyType: 'HASH'
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'id',
        AttributeType: 'S'
      },
      {
        AttributeName: 'email',
        AttributeType: 'S'
      },
      {
        AttributeName: 'username',
        AttributeType: 'S'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'email-index',
        KeySchema: [
          {
            AttributeName: 'email',
            KeyType: 'HASH'
          }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'username-index',
        KeySchema: [
          {
            AttributeName: 'username',
            KeyType: 'HASH'
          }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    const command = new CreateTableCommand(params);
    const result = await client.send(command);
    console.log('✅ Usersテーブルが正常に作成されました:', result.TableDescription.TableName);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('ℹ️  Usersテーブルは既に存在します');
    } else {
      console.error('❌ Usersテーブルの作成でエラーが発生:', error);
      throw error;
    }
  }
}

async function main() {
  console.log('🚀 DynamoDB Localテーブル作成スクリプトを開始...');
  
  try {
    await createUsersTable();
    console.log('🎉 すべてのテーブルが正常に作成されました！');
  } catch (error) {
    console.error('💥 テーブル作成中にエラーが発生しました:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 