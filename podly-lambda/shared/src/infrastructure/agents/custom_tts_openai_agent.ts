import type { AgentFunction, AgentFunctionInfo } from "graphai";
import type {
  GraphAIBuffer,
  GraphAISupressError,
  GraphAIOnError,
  GraphAIText,
} from "@graphai/agent_utils";

import OpenAI from "openai";

export const ttsOpenaiAgent: AgentFunction<
  {
    apiKey?: string;
    model?: string;
    voice?: string;
    instructions?: string;
  } & Partial<GraphAISupressError>,
  Partial<GraphAIBuffer | GraphAIOnError>,
  GraphAIText
> = async ({ namedInputs, params }) => {
  const { text } = namedInputs;
  const { apiKey, model, voice, instructions, supressError } = params;
  const openai = new OpenAI({ apiKey });

  console.log("input voice:", voice);

  try {
    const modelName = model ?? "tts-1";
    const requestConfig: any = {
      model: modelName,
      voice: voice ?? "shimmer",
      input: text,
    };

    if (modelName === "gpt-4o-mini-tts" && instructions) {
      requestConfig.instructions = instructions;
    }

    const response = await openai.audio.speech.create(requestConfig);
    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer };
  } catch (e) {
    if (supressError) {
      return {
        onError: {
          message: "TTS OpenAI Error",
          error: e,
        },
      };
    }
    console.error(e);
    throw new Error("TTS OpenAI Error");
  }
};

const ttsOpenaiAgentInfo: AgentFunctionInfo = {
  name: "ttsOpenaiAgent",
  agent: ttsOpenaiAgent,
  mock: ttsOpenaiAgent,
  samples: [],
  description: "OpenAI TTS agent",
  category: ["voice"],
  author: "Receptron Team",
  repository:
    "https://github.com/receptron/graphai-agents/tree/main/tts/tts-openai-agent",
  source:
    "https://github.com/receptron/graphai-agents/tree/main/voice/tts-openai-agent/src/tts_openai_agent.ts",
  package: "@graphai/tts_openai_agent",
  license: "MIT",
  environmentVariables: ["OPENAI_API_KEY"],
};

export default ttsOpenaiAgentInfo;
