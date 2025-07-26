const path = require("path");
const fs = require("fs");

// ビルドされたLambda関数をインポート
const { createScript: handler } = require("./dist/index.js");

// テストリクエストを読み込み
const testRequest = {
  prompt: "量子コンピュータの最新情報をまとめて",
  reference: [],
  isSearch: true,
  situation: "school",
};

// APIGatewayProxyEventを模擬
function createMockEvent(body) {
  return {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    httpMethod: "POST",
    path: "/script/create",
    queryStringParameters: null,
    pathParameters: null,
    requestContext: {
      requestId: "test-request-id",
      stage: "test",
    },
  };
}

// Contextを模擬
const mockContext = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: "createScript",
  functionVersion: "$LATEST",
  invokedFunctionArn:
    "arn:aws:lambda:us-east-1:123456789012:function:createScript",
  memoryLimitInMB: 512,
  getRemainingTimeInMillis: () => 30000,
  requestId: "test-request-id",
  logGroupName: "/aws/lambda/createScript",
  logStreamName: "test-stream",
  awsRequestId: "test-request-id",
  identity: null,
  clientContext: null,
  succeed: function () {},
  fail: function () {},
  done: function () {},
};

// テスト実行
async function runTest() {
  console.log("🧪 Testing createScript Lambda Function");
  console.log("=".repeat(50));

  // 基本的なテスト
  console.log("\n🔍 Testing basic request:");
  const event = createMockEvent(testRequest);
  console.log("📋 Input:", JSON.stringify(testRequest, null, 2));

  try {
    const result = await handler(event, mockContext);
    console.log("✅ Success! Status:", result.statusCode);
    console.log("📋 Headers:", JSON.stringify(result.headers, null, 2));

    if (result.body) {
      const body = JSON.parse(result.body);
      console.log("📋 Response Body:", JSON.stringify(body, null, 2));
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("📋 Stack:", error.stack);
  }

  console.log("\n" + "=".repeat(50));
  console.log("🏁 Test completed");
}

// テスト実行
runTest().catch(console.error);
