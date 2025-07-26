import { PostScriptRequest, PostScriptResponse } from "@/domain/Script";
import { GraphAI, GraphData, AgentFunctionContext } from "graphai";
import * as agents from "@graphai/agents";
import { openAIAgent } from "@graphai/openai_agent";
import { streamAgentFilterGenerator } from "@graphai/agent_filters";

const messageContent = `次に与えるトピックについて、内容全てを高校生にも分かるように、複数人の登場人物による会話形式、あるいはナレーターによるナレーション形式の台本を作って。ただし要点はしっかりと押さえて。
最初の一言は、Announcerによるトピックの紹介にして。
以下に別のトピックに関するサンプルを貼り付けます。このJSONフォーマットに従って。JSON以外は何も出力しないで。

  [
    {
      "speaker": "Student",
      "text": "先生、今日は韓国で起きた戒厳令のことを教えてもらえますか？"
    },
    {
      "speaker": "Teacher",
      "text": "もちろんだよ、太郎くん。韓国で最近、大統領が「戒厳令」っていうのを突然宣言したんだ。"
    },
    {
      "speaker": "Student",
      "text": "戒厳令ってなんですか？"
    },
    {
      "speaker": "Teacher",
      "text": "簡単に言うと、国がすごく危ない状態にあるとき、軍隊を使って人々の自由を制限するためのものなんだ。たとえば、政治活動を禁止したり、人の集まりを取り締まったりするんだよ。"
    },
    {
      "speaker": "Student",
      "text": "それって怖いですね。なんでそんなことをしたんですか？"
    },
    {
      "speaker": "Teacher",
      "text": "大統領は「国会がうまく機能していないから」と言っていたけど、実際には自分の立場を守るために使ったように見えるんだ。それで、軍隊が国会に突入して、議員たちを捕まえようとしたんだ。"
    },
    {
      "speaker": "Student",
      "text": "ええっ！？国会議員を捕まえようとするなんて、すごく危ないことじゃないですか。"
    },
    {
      "speaker": "Teacher",
      "text": "その通りだよ。もし軍隊が国会を占拠していたら、国会で戒厳令を解除することもできなかったかもしれない。つまり、大統領がずっと自分の好きなように国を支配できるようになってしまうんだ。"
    },
    {
      "speaker": "Student",
      "text": "韓国ではどうなったんですか？"
    },
    {
      "speaker": "Teacher",
      "text": "幸い、野党の議員や市民たちが急いで集まって抗議して、6時間後に戒厳令は解除されたんだ。でも、ほんの少しの違いで、韓国の民主主義が大きく傷つけられるところだったんだよ。"
    },
    {
      "speaker": "Student",
      "text": "それは大変なことですね…。日本ではそんなこと起きないんですか？"
    },
    {
      "speaker": "Teacher",
      "text": "実はね、今、日本でも似たような話があるんだよ。自民党が「緊急事態宣言」を憲法に追加しようとしているんだ。"
    },
    {
      "speaker": "Student",
      "text": "緊急事態宣言って、韓国の戒厳令と同じようなものなんですか？"
    },
    {
      "speaker": "Teacher",
      "text": "似ている部分があるね。たとえば、総理大臣が「社会秩序の混乱の危険があるから」と言えば、特別な権限を使って国を動かすことができるんだ。法律と同じ力を持つ命令を出したり、地方自治体に指示を出したりすることができるんだよ。"
    },
    {
      "speaker": "Student",
      "text": "それって便利そうですけど、なんだか心配です。"
    },
    {
      "speaker": "Teacher",
      "text": "そうだね。もちろん、緊急時には素早い対応が必要だから便利な面もあるけど、その権限が濫用されると、とても危険なんだ。たとえば、総理大臣が自分に都合のいいように国を動かしたり、国民の自由を奪ったりすることができるようになってしまうかもしれない。"
    },
    {
      "speaker": "Student",
      "text": "韓国みたいに、軍隊が政治に口を出してくることもあり得るんですか？"
    },
    {
      "speaker": "Teacher",
      "text": "完全にあり得ないとは言えないからこそ、注意が必要なんだ。私たち国民は、自民党の改憲案が権力の濫用を防ぐための適切な制限を含んでいるのかをしっかり監視し、声を上げることが求められる。民主主義が損なわれるのを防ぐために、私たち一人ひとりが積極的に関心を持つことが大切なんだよ。"
    },
    {
      "speaker": "Student",
      "text": "ありがとうございます。とても良い勉強になりました。"
    },
  ]`;

export const postScript = async (
  script: PostScriptRequest
): Promise<PostScriptResponse> => {
  const tabityApiKey = process.env.TAVILY_API_KEY;

  const messages = [{ role: "system", content: messageContent }];

  if (script.speakers && script.speakers.length > 0) {
    const speakerMessage = `台本には、以下の人物だけを登場させて。\n${script.speakers.join(
      ","
    )}`;
    messages.push({ role: "system", content: speakerMessage });
  } else {
    const speakerMessage = `台本には、以下の人物だけを登場させて。\nAnnouncer,Student,Teacher`;
    messages.push({ role: "system", content: speakerMessage });
  }

  // 4-oは文字数タスク苦手で、文字数指定はまだ難しそうなので保留。
  // if (script.wordCount) {
  //   const wordCountMessage = `台本の文字数は、${script.wordCount}文字程度にしてください。`;
  //   messages.push({ role: "system", content: wordCountMessage });
  // }

  if (script.previousScript) {
    script.previousScript.forEach((s) => {
      messages.push({ role: "user", content: s.prompt });
      messages.push({ role: "assistant", content: JSON.stringify(s.script) });
    });
  }

  const today = new Date();
  const formattedDate = `${today.getFullYear()}/${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${today.getDate().toString().padStart(2, "0")}`;

  const searchMessages = [
    { role: "system", content: messageContent },
    {
      role: "system",
      content: `必要に応じて、searchTavity apiを叩いて情報を取得して。ちなみに、今日の日付は${formattedDate}です。`,
    },
  ];

  if (script.isSearch && script.previousScript) {
    script.previousScript.forEach((s) => {
      searchMessages.push({ role: "user", content: s.prompt });
      searchMessages.push({
        role: "assistant",
        content: JSON.stringify(s.script),
      });
    });
  }
  const tools = [
    {
      type: "function",
      function: {
        name: "searchTavity",
        description:
          "必要に応じてTavityAPIを実行してweb検索し、関連する情報を取得する",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "検索クエリ" },
            max_results: {
              type: "integer",
              description: "検索結果の数",
              default: 2,
            },
          },
          required: ["query"],
        },
      },
    },
  ];

  const webSearchGraph = {
    nodes: {
      fetch: {
        agent: "fetchAgent",
        inputs: {
          url: "https://api.tavily.com/search",
          headers: {
            Authorization: `Bearer ${tabityApiKey}`,
            "Content-Type": "application/json",
          },
          body: {
            query: ":parent_tool.arguments.query",
            max_results: ":parent_tool.arguments.max_results",
            include_raw_content: true,
          },
        },
      },
      extractError: {
        // TODO prop: onError is not hit
        // Extract error title and detail
        agent: "stringTemplateAgent",
        inputs: {
          text: "webSearchError ${:fetch.onError.error.title}: ${:fetch.onError.error.detail}",
        },
        if: ":fetch.onError",
        console: { after: true },
      },
      searchContent: {
        agent: "mapAgent",
        inputs: { rows: ":fetch.results" },
        graph: {
          nodes: {
            formatContent: {
              agent: "copyAgent",
              inputs: {
                title: ":row.title",
                content: ":row.raw_content",
              },
              isResult: true,
            },
          },
        },
      },
      toolMessages: {
        agent: (namedInputs: any) => {
          const { searchContent, messages, tool } = namedInputs;

          const contentList = searchContent.map(
            (con: any) => con.formatContent
          );

          const toolMessage = {
            role: "tool",
            tool_call_id: tool.id,
            name: tool.name,
            content: JSON.stringify(contentList),
          };
          const updatedMessages = messages.concat(toolMessage);
          return updatedMessages;
        },
        inputs: {
          searchContent: ":searchContent",
          messages: ":parent_messages",
          tool: ":parent_tool",
        },
        isResult: true,
      },
      urlArray: {
        agent: (namedInputs: any) => {
          const { fetchResult } = namedInputs;
          const urlArray = fetchResult.map((r: any) => r.url);
          return urlArray;
        },
        inputs: { fetchResult: ":fetch.results" },
        isResult: true,
      },
    },
  };

  const WebExtractGraph = {
    nodes: {
      fetch: {
        agent: "fetchAgent",
        inputs: {
          url: "https://api.tavily.com/extract",
          headers: {
            Authorization: `Bearer ${tabityApiKey}`,
            "Content-Type": "application/json",
          },
          body: {
            urls: ":parent_reference", // []string
          },
        },
      },
      extractError: {
        // TODO prop: onError is not hit
        // Extract error title and detail
        agent: "stringTemplateAgent",
        inputs: {
          text: "webSearchError ${:fetch.onError.error.title}: ${:fetch.onError.error.detail}",
        },
        if: ":fetch.onError",
        console: { after: true },
      },
      extractContent: {
        agent: "mapAgent",
        inputs: { rows: ":fetch.results" },
        graph: {
          nodes: {
            formatContent: {
              agent: "copyAgent",
              inputs: {
                source: ":row.url",
                content: ":row.raw_content",
              },
              isResult: true,
            },
          },
        },
      },
      toolMessages: {
        agent: (namedInputs: any) => {
          const { extractContent, messages } = namedInputs;

          const contentList = extractContent.map(
            (con: any) => con.formatContent
          );

          const toolMessage = {
            role: "system",
            content:
              "web検索で得た以下の情報も、生成する台本に含めてください。\n" +
              JSON.stringify(contentList),
          };
          const updatedMessages = messages.concat(toolMessage);
          return updatedMessages;
        },
        inputs: {
          extractContent: ":extractContent",
          messages: ":parent_messages",
        },
        isResult: true,
      },
    },
  };

  const createScriptGraph: GraphData = {
    version: 0.6,
    nodes: {
      isSearch: {
        value: {},
      },
      promptInput: {
        value: {},
      },
      messages: {
        value: {},
      },
      searchMessage: {
        value: {},
      },
      reference: {
        value: {},
      },
      referenceCheck: {
        agent: (namedInputs) => {
          const { reference } = namedInputs;
          return reference.length > 0;
        },
        inputs: { reference: ":reference" },
      },
      searchCheck: {
        agent: (namedInputs) => {
          const { isSearch } = namedInputs;
          return isSearch;
        },
        inputs: { isSearch: ":isSearch" },
        unless: ":referenceCheck",
      },
      llmCall: {
        agent: "openAIAgent",
        params: { tools },
        inputs: {
          messages: ":searchMessage",
          prompt: ":promptInput",
        },
        if: ":searchCheck",
      },
      messageWithToolCalls: {
        agent: "pushAgent",
        inputs: {
          array: ":messages",
          items: [":llmCall.message"],
        },
        console: { after: true },
      },
      toolCalls: {
        // This node is activated if the LLM requests a tool call.
        agent: "nestedAgent",
        inputs: {
          parent_messages: ":messageWithToolCalls.array",
          parent_tool: ":llmCall.tool",
        },
        if: ":llmCall.tool",
        graph: webSearchGraph,
      },
      noToolCalls: {
        agent: "copyAgent",
        inputs: { data: ":messages" },
        unless: ":llmCall.tool",
      },
      referenceToolCalls: {
        agent: "nestedAgent",
        inputs: {
          parent_messages: ":messages",
          parent_reference: ":reference",
        },
        if: ":referenceCheck",
        graph: WebExtractGraph,
      },
      searchMessages: {
        agent: "copyAgent",
        anyInput: true,
        inputs: {
          array: [
            ":toolCalls.toolMessages",
            ":noToolCalls.data",
            ":referenceToolCalls.toolMessages",
          ],
        },
      },
      notSearchMessages: {
        agent: "copyAgent",
        inputs: { data: ":messages" },
        unless: ":searchCheck",
      },
      scriptMessages: {
        agent: "copyAgent",
        anyInput: true,
        inputs: {
          array: [":notSearchMessages.data", ":searchMessages.array.$0"],
        },
        console: { after: true },
      },
      llm: {
        agent: "openAIAgent",
        params: { stream: true },
        inputs: {
          messages: ":scriptMessages.array.$0",
          prompt: ":promptInput",
        },
      },
      output: {
        agent: "copyAgent",
        inputs: { data: ":llm.text" },
        isResult: true,
      },
      urlArrayOutput: {
        agent: "copyAgent",
        inputs: { url: ":toolCalls.urlArray" },
        isResult: true,
      },
      // streamTest: {
      //   agent: "streamMockAgent",
      //   params: {
      //     message:
      //       "hi, tell me hoge hoge. This is a test.ppppp pppppppp pppppppp pppppppppppppppppppppppppppppppjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhgggggggggggggggggggggggggggggggggggggggggggggggggggggggp",
      //   },
      //   console: { after: true },
      // },
    },
  };

  // streamうまくいかないので保留
  // const callback = (context: AgentFunctionContext, data: string) => {
  //   console.log("Data received:", data);
  //   const { nodeId } = context.debugInfo;
  // };
  // const streamAgentFilter = streamAgentFilterGenerator(callback);
  // const agentFilters = [
  //   {
  //     name: "streamAgentFilter",
  //     agent: streamAgentFilter,
  //     agentIds: ["streamMockAgent", "openAIAgent"],
  //   },
  // ];

  const graphAI = new GraphAI(
    createScriptGraph,
    { ...agents, openAIAgent }
    // { agentFilters }
  );
  graphAI.injectValue("promptInput", script.prompt);
  graphAI.injectValue("isSearch", script.isSearch);
  graphAI.injectValue("messages", messages);
  graphAI.injectValue("searchMessage", searchMessages);
  graphAI.injectValue("reference", script?.reference ?? []);

  const result = await graphAI.run();

  let generatedScriptString = "";
  let urlArrayOutput: string[] = [];
  for (const [_, value] of Object.entries(result)) {
    if (typeof value === "object") {
      for (const [key2, value2] of Object.entries(value)) {
        if (key2 == "data") {
          generatedScriptString = value2;
        } else if (key2 == "url") {
          urlArrayOutput = value2;
        } else {
          throw new Error("data is required");
        }
      }
    }
  }

  console.log("generatedScriptString:", generatedScriptString);

  let outputReference;
  if (urlArrayOutput?.length > 0) {
    outputReference = urlArrayOutput;
  } else if (script.reference && script.reference.length > 0) {
    outputReference = script.reference;
  }

  const res: PostScriptResponse = {
    newScript: {
      prompt: script.prompt,
      script: JSON.parse(generatedScriptString),
      reference: outputReference,
    },
    previousScript: script.previousScript,
  };

  return res;
};
