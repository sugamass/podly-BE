import {
  AgentFunction,
  AgentFunctionInfo,
  assert,
  DefaultConfigData,
} from "graphai";
import { tavily } from "@tavily/core";

type TavilyExtractInputs = {
  urls: string[];
};

type TavilyExtractParams = {
  apiKey?: string;
  includeImages?: boolean;
  extractDepth?: "basic" | "advanced";
  format?: "markdown" | "text";
  timeout?: number;
};

type TavilyExtractResponse = {
  results: Array<{
    url: string;
    rawContent: string;
    images?: string[];
    favicon?: string;
  }>;
  failedResults?: Array<{
    url: string;
    error: string;
  }>;
};

const getTavilyApiKey = (
  params: TavilyExtractParams,
  config?: DefaultConfigData
) => {
  if (params?.apiKey) {
    return params.apiKey;
  }
  if (config?.apiKey) {
    return config.apiKey;
  }
  return typeof process !== "undefined" ? process?.env?.TAVILY_API_KEY : null;
};

export const tavilyExtractAgent: AgentFunction<
  TavilyExtractParams,
  TavilyExtractResponse,
  TavilyExtractInputs,
  DefaultConfigData
> = async ({ namedInputs, params, config }) => {
  const { urls } = namedInputs;

  assert(
    Array.isArray(urls) && urls.length > 0,
    "tavilyExtractAgent: urls array is required! set inputs: { urls: ['https://example.com'] }"
  );

  assert(
    urls.length <= 20,
    "tavilyExtractAgent: maximum 20 URLs allowed per request"
  );

  try {
    const apiKey = getTavilyApiKey(params, config);
    assert(
      apiKey,
      "Tavily API key is required. Please set the TAVILY_API_KEY environment variable or provide it in params/config."
    );

    const tvly = tavily({ apiKey });

    // Convert params to SDK options format
    const sdkOptions: Record<string, unknown> = {};
    if (params?.includeImages !== undefined)
      sdkOptions.includeImages = params.includeImages;
    if (params?.extractDepth !== undefined)
      sdkOptions.extractDepth = params.extractDepth;
    if (params?.format !== undefined) sdkOptions.format = params.format;
    if (params?.timeout !== undefined) sdkOptions.timeout = params.timeout;

    const response = await tvly.extract(urls, sdkOptions);

    console.log("tavily extract:", response);

    return response;
  } catch (error) {
    throw new Error(
      `Tavily extract failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

const tavilyExtractAgentInfo: AgentFunctionInfo = {
  name: "tavilyExtractAgent",
  agent: tavilyExtractAgent,
  mock: tavilyExtractAgent,
  params: {
    type: "object",
    properties: {
      apiKey: {
        type: "string",
        description: "Tavily API key",
      },
      includeImages: {
        type: "boolean",
        description:
          "Include image URLs from the extracted content (default: false)",
      },
      extractDepth: {
        type: "string",
        enum: ["basic", "advanced"],
        description:
          "Extraction depth - basic for faster results, advanced for more comprehensive extraction including tables and embedded content (default: basic)",
      },
      format: {
        type: "string",
        enum: ["markdown", "text"],
        description: "Output format for extracted content (default: markdown)",
      },
      timeout: {
        type: "number",
        description: "Request timeout in seconds (default: 60)",
      },
    },
  },
  inputs: {
    type: "object",
    properties: {
      urls: {
        type: "array",
        items: {
          type: "string",
          format: "uri",
        },
        description: "Array of URLs to extract content from (max 20 URLs)",
        maxItems: 20,
        minItems: 1,
      },
    },
    required: ["urls"],
  },
  output: {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            url: { type: "string" },
            rawContent: { type: "string" },
            images: {
              type: "array",
              items: { type: "string" },
            },
            favicon: { type: "string" },
          },
        },
      },
      failedResults: {
        type: "array",
        items: {
          type: "object",
          properties: {
            url: { type: "string" },
            error: { type: "string" },
          },
        },
      },
    },
  },
  samples: [
    {
      inputs: {
        urls: [
          "https://en.wikipedia.org/wiki/Artificial_intelligence",
          "https://en.wikipedia.org/wiki/Machine_learning",
        ],
      },
      params: {
        includeImages: true,
        extractDepth: "basic",
        format: "markdown",
      },
      result: {
        results: [
          {
            url: "https://en.wikipedia.org/wiki/Artificial_intelligence",
            rawContent:
              "# Artificial Intelligence\n\nArtificial intelligence (AI) is intelligence demonstrated by machines...",
            images: [
              "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/AI-ML-DL.png",
            ],
            favicon: "https://en.wikipedia.org/static/favicon/wikipedia.ico",
          },
        ],
        failedResults: [],
      },
    },
  ],
  description:
    "Extracts raw content from web pages using Tavily Extract API. Supports extraction from multiple URLs with configurable depth and format options.",
  category: ["extract", "web", "content"],
  author: "Receptron Team",
  repository:
    "https://github.com/receptron/mulmocast-cli/tree/main/src/agents/tavily_extract_agent.ts",
  source:
    "https://github.com/receptron/mulmocast-cli/tree/main/src/agents/tavily_extract_agent.ts",
  package: "@receptron/mulmocast-cli",
  license: "MIT",
  environmentVariables: ["TAVILY_API_KEY"],
};

export default tavilyExtractAgentInfo;
