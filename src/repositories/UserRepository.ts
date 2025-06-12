import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { User, UserProfile } from '../types/user';

export class UserRepository {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    // ローカル環境の設定
    const isOffline = process.env.IS_OFFLINE === 'true';
    const dynamoConfig = {
      region: process.env.REGION || 'ap-northeast-1',
      ...(isOffline && {
        endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
        credentials: {
          accessKeyId: 'local',
          secretAccessKey: 'local',
        },
      }),
    };
    
    const dynamoClient = new DynamoDBClient(dynamoConfig);
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = `${process.env.DYNAMODB_TABLE_PREFIX}-users`;
  }

  /**
   * ユーザー作成
   */
  async create(user: User): Promise<User> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: user,
      ConditionExpression: 'attribute_not_exists(id)',
    });

    await this.client.send(command);
    return user;
  }

  /**
   * ユーザーをIDで取得
   */
  async findById(userId: string): Promise<User | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id: userId },
    });

    const result = await this.client.send(command);
    return result.Item as User || null;
  }

  /**
   * メールアドレスまたはユーザー名でユーザーを検索
   */
  async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    // メールアドレスで検索
    const emailCommand = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });

    const emailResult = await this.client.send(emailCommand);
    if (emailResult.Items && emailResult.Items.length > 0) {
      return emailResult.Items[0] as User;
    }

    // ユーザー名で検索
    const usernameCommand = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'username-index',
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username,
      },
    });

    const usernameResult = await this.client.send(usernameCommand);
    if (usernameResult.Items && usernameResult.Items.length > 0) {
      return usernameResult.Items[0] as User;
    }

    return null;
  }

  /**
   * ユーザープロフィール取得（公開情報のみ）
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    // emailを除外してUserProfileとして返す
    const { email, ...profile } = user;
    return profile as UserProfile;
  }

  /**
   * ユーザー更新
   */
  async update(userId: string, updates: Partial<User>): Promise<void> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value], index) => {
      if (key !== 'id' && value !== undefined) {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      }
    });

    if (updateExpressions.length === 0) return;

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id: userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    await this.client.send(command);
  }

  /**
   * ユーザー削除
   */
  async delete(userId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { id: userId },
    });

    await this.client.send(command);
  }
} 