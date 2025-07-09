const { createPreviewAudio } = require("./dist/index");

// テスト用のAPIGatewayProxyEvent
const testEvent = {
  body: JSON.stringify({
    script: [
      {
        speaker: "Teacher",
        text: "皆さん、こんにちは。今日は最新のAI技術について対談していきます。",
        caption: "",
      },
      {
        speaker: "Student",
        text: "こんにちは、田中です。最近のAI技術の進歩は本当に目覚ましいですね。",
        caption: "",
      },
    ],
    tts: "openai",
    voices: ["shimmer", "echo"],
    speakers: ["Teacher", "Student"],
    scriptId: "podcast-ai-discussion-001",
  }),
  headers: {
    "Content-Type": "application/json",
  },
  httpMethod: "POST",
  path: "/audio/preview",
  queryStringParameters: null,
  pathParameters: null,
  stageVariables: null,
  requestContext: {
    accountId: "123456789012",
    apiId: "test-api",
    httpMethod: "POST",
    path: "/audio/preview",
    stage: "test",
    requestId: "test-request-id",
    identity: {
      sourceIp: "127.0.0.1",
    },
  },
  resource: "/audio/preview",
  isBase64Encoded: false,
};

// 追加のテストケース
const testEventShort = {
  body: JSON.stringify({
    script: [
      {
        speaker: "Teacher",
        text: "今日は天気がいいですね。",
        caption: "",
      },
      {
        speaker: "Student",
        text: "本当ですね。散歩日和です。",
        caption: "",
      },
    ],
    tts: "openai",
    voices: ["shimmer", "echo"],
    speakers: ["Teacher", "Student"],
    scriptId: "test-script-short",
  }),
  headers: {
    "Content-Type": "application/json",
  },
  httpMethod: "POST",
  path: "/audio/preview",
  queryStringParameters: null,
  pathParameters: null,
  stageVariables: null,
  requestContext: {
    accountId: "123456789012",
    apiId: "test-api",
    httpMethod: "POST",
    path: "/audio/preview",
    stage: "test",
    requestId: "test-request-id-short",
    identity: {
      sourceIp: "127.0.0.1",
    },
  },
  resource: "/audio/preview",
  isBase64Encoded: false,
};

// テスト用のContext
const testContext = {
  functionName: "createPreviewAudio",
  functionVersion: "$LATEST",
  invokedFunctionArn:
    "arn:aws:lambda:us-east-1:123456789012:function:createPreviewAudio",
  memoryLimitInMB: "1024",
  awsRequestId: "test-request-id",
  logGroupName: "/aws/lambda/createPreviewAudio",
  logStreamName: "test-log-stream",
  getRemainingTimeInMillis: () => 300000, // 5分
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

// テスト実行
async function runTest() {
  try {
    const result = await createPreviewAudio(testEvent, testContext);
    console.log("✅ Test completed successfully!");
    console.log("📤 Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Error details:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
  }
}

// メイン実行

runTest();
