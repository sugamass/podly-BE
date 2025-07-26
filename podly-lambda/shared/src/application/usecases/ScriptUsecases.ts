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
  summarizeWebSearchPrompt,
  generateWebSearchQuery,
  generatewebSearchUserPrompt,
} from "./SystemPrompts";
import customOpenaiAgent from "../../infrastructure/agents/custom_openai_agent";
import tavilySearchAgent from "../../infrastructure/agents/tavily_agent";
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

    const zScriptFormat = z.object({
      speaker: z.string(),
      text: z.string(),
    });

    const podcastJsonFormat = z.object({
      scripts: z.array(zScriptFormat),
    });

    // TODO extractも含める
    const webSearchGraph: GraphData = {
      version: 2.0,
      nodes: {
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

            const webSearchUrls = webSearchResult.results?.map((r: any) => {
              return {
                url: r.url,
                title: r.title,
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
          unless: ":searchCheck",
        },
        webSearchGraph: {
          agent: "nestedAgent",
          inputs: {
            parent_messages: ":messages",
            parent_prompt: ":promptInput",
            parent_webSearchQuery: ":generateWebSearchQueryPrompt",
          },
          if: ":searchCheck",
          graph: webSearchGraph,
        },
        output: {
          agent: "copyAgent",
          anyInput: true,
          inputs: {
            array: [":llm.text", ":webSearchGraph.summarizellm.text"],
          },
          isResult: true,
        },
        urlArrayOutput: {
          agent: "copyAgent",
          inputs: { url: ":webSearchGraph.outputWebSearchResult" },
          isResult: true,
          if: ":searchCheck",
        },
      },
    };

    const graphAI = new GraphAI(createScriptGraph, {
      ...agents,
      customOpenaiAgent,
      tavilySearchAgent,
    });
    graphAI.injectValue("promptInput", request.prompt);
    graphAI.injectValue("isSearch", request.isSearch);
    graphAI.injectValue("messages", messages);
    graphAI.injectValue("reference", request?.reference ?? []);

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
            urlArrayOutput = value2 as any[];
          }
        }
      }
    }

    if (!generatedScriptString) {
      throw new Error("Failed to generate script");
    }

    let outputReference: Reference[] = [];

    console.log("urlArrayOutput:", urlArrayOutput);
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
