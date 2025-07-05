import OpenAI from "openai";
import { AgentFunction, AgentFunctionInfo, sleep } from "graphai";
import {
  GraphAILLMInputBase,
  getMergeValue,
  getMessages,
  LLMMetaResponse,
  LLMMetaData,
  convertMeta,
  initLLMMetaData,
  llmMetaDataEndTime,
  llmMetaDataFirstTokenTime,
} from "@graphai/llm_utils";
import type {
  GraphAINullableText,
  GraphAITool,
  GraphAIToolCalls,
} from "@graphai/agent_utils";

// OpenAI Responses API の公式型定義を使用
type OpenAIResponsesInputs = {
  // 基本パラメータ
  model?: string;
  instructions: string | Array<any> | null;
  input?: string | any; // ResponseInputは複雑な型なのでanyで対応
  stream?: boolean | null;

  // 高度なパラメータ
  background?: boolean | null;
  include?: Array<string> | null; // ResponseIncludableの簡易版
  max_output_tokens?: number | null;
  metadata?: Record<string, string> | null; // Metadataの簡易版
  parallel_tool_calls?: boolean | null;
  previous_response_id?: string | null;
  prompt?: any | null; // ResponsePromptの簡易版
  reasoning?: any | null; // Reasoningの簡易版
  service_tier?: "auto" | "default" | "flex" | "scale" | null;
  store?: boolean | null;
  temperature?: number | null;
  text?: any; // ResponseTextConfigの簡易版
  tool_choice?: any; // ToolChoiceの簡易版
  tools?: Array<any>; // Toolの簡易版
  top_p?: number | null;
  truncation?: "auto" | "disabled" | null;
  user?: string;

  // GraphAI固有のパラメータ
  verbose?: boolean;
  response_format?: any; // 互換性のために追加
} & GraphAILLMInputBase;

type OpenAIResponsesConfig = {
  baseURL?: string;
  apiKey?: string;
  forWeb?: boolean;
  dataStream?: boolean;
};

type OpenAIResponsesParams = OpenAIResponsesInputs &
  OpenAIResponsesConfig & { dataStream?: boolean };

type OpenAIResponsesResult = Partial<
  GraphAINullableText & {
    output_text?: string;
    response_id?: string;
    request_id?: string;
    response?: any;
  } & LLMMetaResponse
>;

const convertOpenAIResponsesCompletion = (
  response: any,
  llmMetaData: LLMMetaData
) => {
  llmMetaDataEndTime(llmMetaData);

  console.log("OpenAI Responses API response:", response);

  console.log("annotations", response.output[1]?.content);

  const text = response.output_text || null;
  const response_id = response.id || null;
  const request_id = response._request_id || null;

  return {
    text,
    output_text: text,
    response_id,
    request_id,
    response,
    metadata: convertMeta(llmMetaData),
  };
};

export const openAIResponsesAgent: AgentFunction<
  OpenAIResponsesParams,
  OpenAIResponsesResult,
  OpenAIResponsesInputs,
  OpenAIResponsesConfig
> = async ({ filterParams, params, namedInputs, config }) => {
  const {
    verbose,
    instructions,
    input,
    stream,
    response_format,
    prompt,
    background,
    include,
    max_output_tokens,
    metadata,
    parallel_tool_calls,
    previous_response_id,
    reasoning,
    service_tier,
    store,
    temperature,
    text,
    tool_choice,
    tools,
    top_p,
    truncation,
    user,
  } = {
    ...params,
    ...namedInputs,
  };

  const { apiKey, dataStream, forWeb, model, baseURL } = {
    ...(config || {}),
    ...params,
  };

  const llmMetaData = initLLMMetaData();

  const userInput =
    input ||
    prompt ||
    getMergeValue(namedInputs, params, "mergeablePrompts", prompt);

  // 入力を文字列として確保
  const finalInput = Array.isArray(userInput)
    ? userInput.join(" ")
    : userInput || "";

  if (verbose) {
    console.log("OpenAI Responses API Input:", finalInput);
    console.log("Instructions:", instructions);
    console.log("Stream:", stream);
  }

  const openai = new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: !!forWeb,
  });

  const modelName = model || "gpt-4o";

  try {
    if (!stream && !dataStream) {
      // 非ストリーミングモード
      const responseParams: any = {
        model: modelName,
        instructions: instructions || "You are a helpful assistant.",
        input: finalInput,
        background,
        include,
        max_output_tokens,
        metadata,
        parallel_tool_calls,
        previous_response_id,
        reasoning,
        service_tier,
        store,
        temperature,
        text,
        tool_choice,
        tools,
        top_p,
        truncation,
        user,
      };
      if (response_format) {
        responseParams.response_format = response_format;
      }

      const result = await openai.responses.create(responseParams);
      return convertOpenAIResponsesCompletion(result, llmMetaData);
    } else {
      // ストリーミングモード
      if (dataStream && filterParams && filterParams.streamTokenCallback) {
        filterParams.streamTokenCallback({
          type: "response.created",
          response: {},
        });
      }

      // ストリーミングパラメータを設定
      const streamParams: any = {
        model: modelName,
        instructions: instructions || "You are a helpful assistant.",
        input: finalInput,
        stream: true,
      };
      if (response_format) {
        streamParams.response_format = response_format;
      }

      if (verbose) {
        console.log("Creating streaming response with params:", streamParams);
      }

      let fullText = "";
      let firstTokenReceived = false;

      try {
        // 実際のOpenAI Responses APIストリーミングを使用
        const stream: any = await (openai.responses as any).create(
          streamParams
        );

        if (verbose) {
          console.log("Stream created successfully");
        }

        // ストリーミングイテレータを使用してイベントを処理
        if (stream && typeof stream[Symbol.asyncIterator] === "function") {
          for await (const event of stream) {
            if (!firstTokenReceived) {
              llmMetaDataFirstTokenTime(llmMetaData);
              firstTokenReceived = true;
            }

            if (verbose) {
              console.log("Stream event:", event);
            }

            // Responses APIのストリーミングイベントを処理
            const eventAny = event as any;
            let token = null;

            // 様々なストリーミングイベントタイプに対応
            if (eventAny.type === "response.text.delta" && eventAny.delta) {
              token = eventAny.delta;
            } else if (eventAny.type === "response.output_item.added") {
              if (
                eventAny.output_item?.type === "text" &&
                eventAny.output_item.text
              ) {
                token = eventAny.output_item.text;
              }
            } else if (eventAny.type === "response.content_part.added") {
              if (eventAny.part?.type === "text" && eventAny.part.text) {
                token = eventAny.part.text;
              }
            } else if (eventAny.type === "response.text.done") {
              if (verbose) {
                console.log("Text generation completed");
              }
            } else if (eventAny.type === "response.done") {
              if (verbose) {
                console.log("Response completed");
              }
            } else {
              // その他のイベント（汎用処理）
              if (eventAny.delta) {
                token = eventAny.delta;
              } else if (eventAny.text) {
                token = eventAny.text;
              } else if (eventAny.content) {
                token = eventAny.content;
              }
            }

            if (token && filterParams && filterParams.streamTokenCallback) {
              fullText += token;

              if (dataStream) {
                filterParams.streamTokenCallback({
                  type: "response.in_progress",
                  response: {
                    output: [
                      {
                        type: "text",
                        text: token,
                      },
                    ],
                  },
                });
              } else {
                filterParams.streamTokenCallback(token);
              }
            }
          }

          if (dataStream && filterParams && filterParams.streamTokenCallback) {
            filterParams.streamTokenCallback({
              type: "response.completed",
              response: {},
            });
          }

          return {
            text: fullText,
            output_text: fullText,
            response_id: `resp_stream_${Date.now()}`,
            request_id: `req_stream_${Date.now()}`,
            metadata: convertMeta(llmMetaData),
          };
        } else {
          // ストリーミングが利用できない場合、通常のレスポンスとして処理
          if (verbose) {
            console.log("Stream not available, processing as regular response");
          }

          const result = stream;
          fullText = result.output_text || "";

          if (filterParams && filterParams.streamTokenCallback) {
            // シミュレーションストリーミング
            for (const char of fullText) {
              if (!firstTokenReceived) {
                llmMetaDataFirstTokenTime(llmMetaData);
                firstTokenReceived = true;
              }

              if (dataStream) {
                filterParams.streamTokenCallback({
                  type: "response.in_progress",
                  response: {
                    output: [
                      {
                        type: "text",
                        text: char,
                      },
                    ],
                  },
                });
              } else {
                filterParams.streamTokenCallback(char);
              }

              await sleep(5);
            }
          }

          if (dataStream && filterParams && filterParams.streamTokenCallback) {
            filterParams.streamTokenCallback({
              type: "response.completed",
              response: {},
            });
          }

          return convertOpenAIResponsesCompletion(result, llmMetaData);
        }
      } catch (streamError) {
        console.error("Streaming error:", streamError);

        // ストリーミングエラーの場合、非ストリーミングにフォールバック
        if (verbose) {
          console.log("Falling back to non-streaming mode");
        }

        const fallbackParams: any = {
          model: modelName,
          instructions: instructions || "You are a helpful assistant.",
          input: finalInput,
        };
        if (response_format) {
          fallbackParams.response_format = response_format;
        }

        const result = await openai.responses.create(fallbackParams);
        fullText = result.output_text || "";

        // フォールバック時もコールバックを呼び出し
        if (filterParams && filterParams.streamTokenCallback) {
          for (const char of fullText) {
            if (!firstTokenReceived) {
              llmMetaDataFirstTokenTime(llmMetaData);
              firstTokenReceived = true;
            }

            if (dataStream) {
              filterParams.streamTokenCallback({
                type: "response.in_progress",
                response: {
                  output: [
                    {
                      type: "text",
                      text: char,
                    },
                  ],
                },
              });
            } else {
              filterParams.streamTokenCallback(char);
            }
            await sleep(10);
          }
        }

        if (dataStream && filterParams && filterParams.streamTokenCallback) {
          filterParams.streamTokenCallback({
            type: "response.completed",
            response: {},
          });
        }

        return convertOpenAIResponsesCompletion(result, llmMetaData);
      }
    }
  } catch (error) {
    console.error("OpenAI Responses API Error:", error);
    throw error;
  }
};

export const openAIResponsesMockAgent: AgentFunction<
  OpenAIResponsesParams,
  OpenAIResponsesResult,
  OpenAIResponsesInputs,
  OpenAIResponsesConfig
> = async ({ filterParams }) => {
  const output_text = "こんにちは！これはモックレスポンスです。";

  if (filterParams && filterParams.streamTokenCallback) {
    for await (const token of output_text.split("")) {
      await sleep(50);
      filterParams.streamTokenCallback(token);
    }
  }

  return {
    text: output_text,
    output_text,
    response_id: "resp_mock123",
    request_id: "req_mock123",
  };
};

const customOpenaiResponsesAgentInfo: AgentFunctionInfo = {
  name: "openAIResponsesAgent",
  agent: openAIResponsesAgent,
  mock: openAIResponsesMockAgent,
  inputs: {
    type: "object",
    properties: {
      model: {
        type: "string",
        description: "The OpenAI model to use (e.g., gpt-4o)",
      },
      instructions: {
        type: "string",
        description: "System instructions for the assistant",
      },
      input: {
        type: "string",
        description: "User input text",
      },
      verbose: {
        type: "boolean",
        description: "Enable verbose logging",
      },
      stream: {
        type: "boolean",
        description: "Enable streaming response",
      },
      baseURL: {
        type: "string",
        description: "Custom OpenAI API base URL",
      },
      apiKey: {
        anyOf: [{ type: "string" }, { type: "object" }],
        description: "OpenAI API key",
      },
      prompt: {
        type: "string",
        description: "Alternative to input for compatibility",
      },
      response_format: {
        type: "object",
        description: "Response format specification",
      },
    },
  },
  output: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "Generated text response",
      },
      output_text: {
        type: "string",
        description: "Generated output text (Responses API format)",
      },
      response_id: {
        type: "string",
        description: "Unique response identifier",
      },
      request_id: {
        type: "string",
        description: "Unique request identifier for debugging",
      },
      response: {
        type: "object",
        description: "Full response object from OpenAI",
      },
      metadata: {
        type: "object",
        description: "LLM metadata including timing information",
      },
    },
  },
  params: {
    type: "object",
    properties: {
      model: {
        type: "string",
        description: "The OpenAI model to use (e.g., gpt-4o)",
      },
      instructions: {
        type: "string",
        description: "System instructions for the assistant",
      },
      input: {
        type: "string",
        description: "User input text",
      },
      verbose: {
        type: "boolean",
        description: "Enable verbose logging",
      },
      stream: {
        type: "boolean",
        description: "Enable streaming response",
      },
      baseURL: {
        type: "string",
        description: "Custom OpenAI API base URL",
      },
      apiKey: {
        anyOf: [{ type: "string" }, { type: "object" }],
        description: "OpenAI API key",
      },
      prompt: {
        type: "string",
        description: "Alternative to input for compatibility",
      },
      response_format: {
        type: "object",
        description: "Response format specification",
      },
    },
  },
  category: ["llm"],
  description: "OpenAI Responses API エージェント（実際のストリーミング対応）",
  author: "GraphAI Team",
  repository: "https://github.com/receptron/graphai",
  license: "MIT",
  samples: [
    {
      inputs: { input: "日本語で挨拶してください" },
      params: { model: "gpt-4o" },
      result: {
        output_text: "こんにちは！",
        response_id: "resp_abc123",
        request_id: "req_abc123",
        text: "こんにちは！",
      },
    },
    {
      inputs: { input: "What is TypeScript?", stream: true },
      params: { model: "gpt-4o", verbose: true },
      result: {
        output_text: "TypeScript is a strongly typed programming language...",
        response_id: "resp_def456",
        request_id: "req_def456",
        text: "TypeScript is a strongly typed programming language...",
      },
    },
  ],
};

export default customOpenaiResponsesAgentInfo;
