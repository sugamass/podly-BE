// ビルドされたLambda関数をインポート
const { createScript: handler } = require("./dist/index.js");

// テストリクエストを読み込み
const testRequest = {
  prompt: "最新のテクノロジーのニュースをまとめて",
  // previousScript: [
  //   {
  //     prompt: "問題と課題の違いは？",
  //     script: [
  //       {
  //         speaker: "Announcer",
  //         text: "今日のトピックは『問題と課題の違い』です。高校生にも分かりやすく、会話形式で解説していきます。",
  //       },
  //       {
  //         speaker: "Student",
  //         text: "先生、よく『問題』とか『課題』って言葉を聞くんですけど、違いがよく分かりません。教えてもらえますか？",
  //       },
  //       {
  //         speaker: "Teacher",
  //         text: "いい質問だね！『問題』と『課題』は似ているけど、実はちゃんと違いがあるんだよ。",
  //       },
  //       {
  //         speaker: "Student",
  //         text: "どう違うんですか？",
  //       },
  //       {
  //         speaker: "Teacher",
  //         text: "まず『問題』は、今すぐ解決しなきゃいけない困ったことや、うまくいっていない状態のことを指すんだ。例えば、『テストの点が悪い』とか『部活のメンバーが足りない』みたいなことだね。",
  //       },
  //       {
  //         speaker: "Student",
  //         text: "なるほど。じゃあ『課題』は？",
  //       },
  //       {
  //         speaker: "Teacher",
  //         text: "『課題』は、これから解決したい目標とか、取り組むべきテーマのことなんだ。『どうやったらテストの点を上げられるか』『部活の新入部員を増やす方法を考える』みたいに、問題を解決するために取り組むべきことが課題になるんだよ。",
  //       },
  //       {
  //         speaker: "Student",
  //         text: "つまり、問題は『困っていること』で、課題は『それを解決するためにやること』って感じですか？",
  //       },
  //       {
  //         speaker: "Teacher",
  //         text: "その通り！例えば部活の例で言うと、『メンバーが足りない』が問題、『新入部員をどうやって増やすか考える』が課題なんだ。",
  //       },
  //       {
  //         speaker: "Student",
  //         text: "分かりやすいです！じゃあ、課題は問題がなくても出てくる場合もあるんですか？",
  //       },
  //       {
  //         speaker: "Teacher",
  //         text: "いい視点だね。課題は、問題がなくても『もっと良くしたい』『目標を達成したい』ときにも出てくるよ。例えば『全国大会に出場する』とか『学校の雰囲気を明るくする』みたいな、今すぐ困っていないけど、将来のために取り組むべきことも課題なんだ。",
  //       },
  //       {
  //         speaker: "Student",
  //         text: "なるほど、将来に向けたチャレンジも課題なんですね。",
  //       },
  //       {
  //         speaker: "Teacher",
  //         text: "その通り！要するに、『問題』は今困っていること、『課題』はそれを解決したり、もっと良くするために考えること。こうやって区別して使うと、物事を整理しやすくなるよ。",
  //       },
  //       {
  //         speaker: "Student",
  //         text: "これからは使い分けて考えるようにします！ありがとうございました。",
  //       },
  //     ],
  //     reference: [],
  //   },
  // ],
  reference: [
    // {
    //   title: "",
    //   url: "https://www.kaonavi.jp/dictionary/mondai-kadai/",
    // },
  ],
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
