import {
  CreateScriptUseCaseInput,
  CreateScriptUseCaseOutput,
  PromptScriptData,
  Reference,
} from "../../domain/script/entities/ScriptEntity";
import { GraphAI, GraphData } from "graphai";
import * as agents from "@graphai/agents";
import {
  schoolPrompt,
  generateWebSearchQuery,
  generatewebSearchUserPrompt,
} from "./SystemPrompts";
import customOpenaiAgent from "../../infrastructure/agents/custom_openai_agent";
import tavilySearchAgent from "../../infrastructure/agents/tavily_agent";
import tavilyExtractAgent from "../../infrastructure/agents/tavily_extract_agent";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

export class CreateScriptUseCase {
  async execute(
    request: CreateScriptUseCaseInput
  ): Promise<CreateScriptUseCaseOutput> {
    // ドメイン固有のバリデーション
    this.validateDomainRules(request);

    // 2. 新しいスクリプトを生成
    const newScript = await this.generateScript(request);

    // 3. レスポンスを構築
    const response: CreateScriptUseCaseOutput = {
      newScript: newScript,
      previousScript: request.previousScript || [],
    };

    return response;
  }

  /**
   * ドメイン固有のルール（ビジネスルール）を検証する
   */
  private validateDomainRules(request: CreateScriptUseCaseInput): void {
    // situationの有効値チェック（ビジネスルール）
    if (request.situation && !this.isValidSituation(request.situation)) {
      throw new Error("Invalid situation");
    }

    // promptが必須
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error("Prompt is required");
    }

    // その他のドメイン固有のルールがあればここに追加
    // 例：特定のキーワードの組み合わせが禁止されている、など
  }

  /**
   * 新しいスクリプトを生成する
   */
  private async generateScript(
    request: CreateScriptUseCaseInput
  ): Promise<PromptScriptData> {
    const messages = [{ role: "system", content: schoolPrompt }];

    if (request.previousScript) {
      request.previousScript.forEach((s) => {
        messages.push({ role: "user", content: s.prompt });
        messages.push({ role: "assistant", content: JSON.stringify(s.script) });
      });
    }

    // referenceで指定ありまたはweb検索機能onの場合は検索を行う
    const isSearch =
      (request.reference && request.reference.length > 0) || request.isSearch;

    const referenceUrls = request.reference?.map((r) => r.url);

    const fieldsAndUrls = [
      {
        field: "general",
        urls: ["https://www.nhk.or.jp/rss/news/cat0.xml"],
      },
      {
        field: "social",
        urls: ["https://www.nhk.or.jp/rss/news/cat1.xml"],
      },
      {
        field: "technology",
        urls: ["https://www.nhk.or.jp/rss/news/cat2.xml"],
      },
      {
        field: "politics",
        urls: ["https://www.nhk.or.jp/rss/news/cat3.xml"],
      },
      {
        field: "economy",
        urls: ["https://www.nhk.or.jp/rss/news/cat4.xml"],
      },
      {
        field: "world",
        urls: ["https://www.nhk.or.jp/rss/news/cat5.xml"],
      },
      {
        field: "sports",
        urls: ["https://www.nhk.or.jp/rss/news/cat6.xml"],
      },
      {
        field: "entertainment",
        urls: ["https://www.nhk.or.jp/rss/news/cat7.xml"],
      },
    ];

    const zScriptFormat = z.object({
      speaker: z.string(),
      text: z.string(),
    });

    const podcastJsonFormat = z.object({
      scripts: z.array(zScriptFormat),
    });

    const FieldEnum = z.enum([
      "general",
      "social",
      "technology",
      "politics",
      "economy",
      "sports",
      "world",
      "entertainment",
    ]);
    const judgeRssNeedFormat = z.object({
      rssNeed: z.boolean(),
      field: z.string(),
      keywords: z.array(FieldEnum),
    });

    const weSearchWithRssGraph: GraphData = {
      version: 2.0,
      nodes: {
        rssFeedUrls: {
          agent: (namedInputs) => {
            const { fieldAndKeywords } = namedInputs;
            const matchedField = fieldsAndUrls.find(
              (f) => f.field === fieldAndKeywords.field
            );

            const rssFeedUrls = matchedField?.urls ?? [];

            return rssFeedUrls;
          },
          inputs: { fieldAndKeywords: ":parent_fieldAndKeywords" },
        },
      },
    };

    // graphAIのanyInputの挙動が改良されたら、extractも含めたい
    const webSearchGraph: GraphData = {
      version: 2.0,
      nodes: {
        judgeRssNeed: {
          agent: "customOpenaiAgent",
          params: {
            model: "gpt-4o-mini",
            apiKey: process.env.OPENAI_API_KEY,
            response_format: zodResponseFormat(
              judgeRssNeedFormat,
              "judgeRssNeed"
            ),
          },
          inputs: {
            messages: ":parent_messages",
            prompt: ":parent_prompt",
          },
        },
        ifRss: {
          agent: (namedInputs) => {
            const { judgeRssNeed } = namedInputs;

            try {
              const judgeRssNeedObject = JSON.parse(judgeRssNeed);
              return judgeRssNeedObject.rssNeed;
            } catch (error) {
              throw new Error("Failed to parse judgeRssNeed");
            }
          },
          inputs: { judgeRssNeed: ":judgeRssNeed.text" },
        },
        generateWebSearchQuery: {
          agent: "customOpenaiAgent",
          params: {
            model: "gpt-4o-mini",
            apiKey: process.env.OPENAI_API_KEY,
            response_format: zodResponseFormat(
              z.object({ query: z.string() }),
              "webSearchQuery"
            ),
          },
          inputs: {
            messages: ":parent_webSearchQuery",
            prompt: ":parent_prompt",
          },
          unless: ":ifRss",
        },
        convertWebSearchQuery: {
          agent: (namedInputs) => {
            const { llmOutput } = namedInputs;

            const queryObject = JSON.parse(llmOutput.text);

            return queryObject.query;
          },
          inputs: {
            llmOutput: ":generateWebSearchQuery",
          },
        },
        webSearch: {
          agent: "tavilySearchAgent",
          params: {
            apiKey: process.env.TAVILY_API_KEY,
            max_results: 5,
            search_depth: "basic",
            include_answer: false,
            include_raw_content: "markdown",
          },
          inputs: {
            query: ":convertWebSearchQuery",
          },
        },
        outputWebSearchResult: {
          agent: (namedInputs) => {
            const { webSearchResult } = namedInputs;

            console.log("webSearchResult:", webSearchResult);

            const webSearchUrls = webSearchResult.results?.map((r: any) => {
              return {
                url: r.url,
                title: r.title ?? "",
              };
            });

            return webSearchUrls;
          },
          inputs: {
            webSearchResult: ":webSearch",
          },
          isResult: true,
        },
        updateMessages: {
          agent: (namedInputs) => {
            const { messages, webSearchResult } = namedInputs;

            console.log("webSearchResult2:", webSearchResult);

            const webSearchResultString =
              webSearchResult.results
                ?.map((r: any) =>
                  JSON.stringify({
                    title: r.title,
                    content: r.raw_content,
                  })
                )
                .join("\n\n") ?? "";

            const newMessage = {
              role: "system",
              content: generatewebSearchUserPrompt(
                messages,
                webSearchResultString
              ),
            };
            messages.push(newMessage);

            return messages;
          },
          inputs: {
            messages: ":parent_messages",
            webSearchResult: ":webSearch",
          },
        },
        summarizellm: {
          agent: "customOpenaiAgent",
          params: {
            model: "gpt-4.1",
            apiKey: process.env.OPENAI_API_KEY,
            response_format: zodResponseFormat(podcastJsonFormat, "podcast"),
          },
          inputs: {
            messages: ":updateMessages",
            prompt: ":parent_prompt",
          },
          console: { after: true },
          isResult: true,
        },
      },
    };

    const extractGraph: GraphData = {
      version: 2.0,
      nodes: {
        webExtract: {
          agent: "tavilyExtractAgent",
          params: {
            apiKey: process.env.TAVILY_API_KEY,
            extract_depth: "basic",
            format: "markdown",
            timeout: 10000,
          },
          inputs: {
            urls: ":parent_reference",
          },
        },
        outputWebSearchResult: {
          agent: (namedInputs) => {
            const { webSearchResult } = namedInputs;

            const webSearchUrls = webSearchResult.results?.map((r: any) => {
              return {
                url: r.url,
                title: r.title ?? "",
              };
            });

            return webSearchUrls;
          },
          inputs: {
            webSearchResult: ":webExtract",
          },
          isResult: true,
        },
        updateMessages: {
          agent: (namedInputs) => {
            const { webSearchResult, messages } = namedInputs;

            const webSearchResultString =
              webSearchResult.results
                ?.map((r: any) =>
                  JSON.stringify({
                    title: r.title,
                    content: r.raw_content,
                  })
                )
                .join("\n\n") ?? "";

            const newMessage = {
              role: "system",
              content: generatewebSearchUserPrompt(
                messages,
                webSearchResultString
              ),
            };
            messages.push(newMessage);

            return messages;
          },
          inputs: {
            messages: ":parent_messages",
            webSearchResult: ":webExtract",
          },
        },
        summarizellm: {
          agent: "customOpenaiAgent",
          params: {
            model: "gpt-4.1",
            apiKey: process.env.OPENAI_API_KEY,
            response_format: zodResponseFormat(podcastJsonFormat, "podcast"),
          },
          inputs: {
            messages: ":updateMessages",
            prompt: ":parent_prompt",
          },
          console: { after: true },
          isResult: true,
        },
      },
    };

    const createScriptGraph: GraphData = {
      version: 2.0,
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
        reference: {
          value: {},
        },
        generateWebSearchQueryPrompt: {
          value: {},
        },
        llm: {
          agent: "customOpenaiAgent",
          params: {
            model: "gpt-4.1",
            apiKey: process.env.OPENAI_API_KEY,
            response_format: zodResponseFormat(podcastJsonFormat, "podcast"),
          },
          inputs: {
            messages: ":messages",
            prompt: ":promptInput",
          },
          unless: ":isSearch",
        },
        referenceCheck: {
          agent: (namedInputs) => {
            const { reference } = namedInputs;
            return reference.length > 0;
          },
          inputs: { reference: ":reference" },
          if: ":isSearch",
        },
        webSearchGraph: {
          agent: "nestedAgent",
          inputs: {
            parent_messages: ":messages",
            parent_prompt: ":promptInput",
            parent_webSearchQuery: ":generateWebSearchQueryPrompt",
          },
          graph: webSearchGraph,
          unless: ":referenceCheck",
        },
        webExtractGraph: {
          agent: "nestedAgent",
          inputs: {
            parent_messages: ":messages",
            parent_prompt: ":promptInput",
            parent_reference: ":reference",
          },
          graph: extractGraph,
          if: ":referenceCheck",
        },
        output: {
          agent: "copyAgent",
          anyInput: true,
          inputs: {
            array: [
              ":llm.text",
              ":webSearchGraph.summarizellm.text",
              ":webExtractGraph.summarizellm.text",
            ],
          },
          isResult: true,
        },
        urlArrayOutput: {
          agent: "copyAgent",
          anyInput: true,
          inputs: {
            url: [
              ":webSearchGraph.outputWebSearchResult",
              ":webExtractGraph.outputWebSearchResult",
            ],
          },
          isResult: true,
          if: ":isSearch",
        },
      },
    };

    const graphAI = new GraphAI(createScriptGraph, {
      ...agents,
      customOpenaiAgent,
      tavilySearchAgent,
      tavilyExtractAgent,
    });
    graphAI.injectValue("promptInput", request.prompt);
    graphAI.injectValue("isSearch", isSearch);
    graphAI.injectValue("messages", messages);
    graphAI.injectValue("reference", referenceUrls);

    const now = new Date()
      .toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
      .split("T")[0];
    graphAI.injectValue("generateWebSearchQueryPrompt", [
      {
        role: "system",
        content: generateWebSearchQuery(now, request.prompt),
      },
    ]);

    const result = await graphAI.run();

    console.log("resulttttttttt:", result);

    let generatedScriptString = "";
    let urlArrayOutput: any[] = [];
    for (const [_, value] of Object.entries(result)) {
      if (typeof value === "object" && value !== null) {
        for (const [key2, value2] of Object.entries(value)) {
          console.log("key2:", key2);
          if (key2 === "array") {
            generatedScriptString = (value2 as any[])[0];
          } else if (key2 === "url") {
            urlArrayOutput = (value2 as any[])[0];
          }
        }
      }
    }

    if (!generatedScriptString) {
      throw new Error("Failed to generate script");
    }

    let outputReference: Reference[] = [];

    if (urlArrayOutput?.length > 0) {
      outputReference = urlArrayOutput.map((searchResult: any) => ({
        url: searchResult.url,
        title: searchResult.title || undefined, // titleが空文字の場合はundefinedにする
      }));
    } else if (request.reference && request.reference.length > 0) {
      outputReference = request.reference; // 既にReference[]型なのでそのまま使用
    }

    const script = JSON.parse(generatedScriptString);
    const scriptResult = script.scripts;

    return {
      prompt: request.prompt,
      script: scriptResult,
      reference: outputReference || [],
      situation: request.situation,
    };
  }

  private isValidSituation(situation: string): boolean {
    const validSituations = [
      "school",
      "expert",
      "interview",
      "friends",
      "radio_personality",
    ];
    return validSituations.includes(situation);
  }
}
