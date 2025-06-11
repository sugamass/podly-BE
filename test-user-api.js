const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testCreateUser() {
  try {
    console.log('🚀 ユーザー作成APIをテスト中...');
    
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      bio: 'This is a test user for API testing'
    };
    
    console.log('📤 送信データ:', JSON.stringify(userData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/users`, userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ レスポンス成功!');
    console.log('📥 レスポンスデータ:', JSON.stringify(response.data, null, 2));
    console.log('📊 ステータスコード:', response.status);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:');
    
    if (error.response) {
      console.error('📊 ステータスコード:', error.response.status);
      console.error('📥 エラーレスポンス:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('📡 リクエストエラー:', error.message);
      console.error('💡 サーバーが起動していない可能性があります');
    } else {
      console.error('🔧 設定エラー:', error.message);
    }
  }
}

// バリデーションエラーのテスト
async function testValidationError() {
  try {
    console.log('\n🧪 バリデーションエラーをテスト中...');
    
    const invalidData = {
      email: 'invalid-email', // 無効なメールアドレス
      username: 'ab', // 短すぎるユーザー名
      displayName: '', // 空の表示名
    };
    
    console.log('📤 送信データ:', JSON.stringify(invalidData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/users`, invalidData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('⚠️ 予期しない成功レスポンス:', response.data);
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ 期待通りのバリデーションエラー!');
      console.log('📥 エラーレスポンス:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ 予期しないエラー:', error.message);
    }
  }
}

// 重複エラーのテスト
async function testDuplicateError() {
  try {
    console.log('\n🔄 重複エラーをテスト中...');
    
    const userData = {
      email: 'test@example.com', // 既に作成済みのメールアドレス
      username: 'testuser', // 既に作成済みのユーザー名
      displayName: 'Another Test User',
    };
    
    console.log('📤 送信データ:', JSON.stringify(userData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/users`, userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('⚠️ 予期しない成功レスポンス:', response.data);
    
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.log('✅ 期待通りの重複エラー!');
      console.log('📥 エラーレスポンス:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ 予期しないエラー:', error.message);
    }
  }
}

async function runTests() {
  console.log('🎯 ユーザー作成API テストスイート\n');
  
  await testCreateUser();
  await testValidationError();
  await testDuplicateError();
  
  console.log('\n🏁 テスト完了!');
}

runTests(); 