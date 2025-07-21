import type { AgentFunction, AgentFunctionInfo } from "graphai";
import type {
  GraphAIBuffer,
  GraphAISupressError,
  GraphAIOnError,
  GraphAIText,
} from "@graphai/agent_utils";

export const ttsGeminiAgent: AgentFunction<
  {
    apiKey?: string;
    model?: string;
    voiceName?: string;
  } & Partial<GraphAISupressError>,
  Partial<GraphAIBuffer | GraphAIOnError>,
  GraphAIText
> = async ({ namedInputs, params }) => {
  const { text } = namedInputs;
  const { apiKey, model, voiceName, supressError } = params;

  try {
    const modelName = model ?? "gemini-2.5-flash-preview-tts";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: text,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName ?? "Kore",
            },
          },
        },
      },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey || "",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Gemini TTS API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
      throw new Error("No audio data received from Gemini TTS API");
    }

    const base64Audio = data.candidates[0].content.parts[0].inlineData.data;
    const buffer = Buffer.from(base64Audio, "base64");
    
    return { buffer };
  } catch (e) {
    if (supressError) {
      return {
        onError: {
          message: "TTS Gemini Error",
          error: e,
        },
      };
    }
    console.error(e);
    throw new Error("TTS Gemini Error");
  }
};

const ttsGeminiAgentInfo: AgentFunctionInfo = {
  name: "ttsGeminiAgent",
  agent: ttsGeminiAgent,
  mock: ttsGeminiAgent,
  samples: [],
  description: "Gemini 2.5 TTS Preview agent",
  category: ["voice"],
  author: "Podly Team",
  repository: "",
  source: "",
  package: "",
  license: "MIT",
  environmentVariables: ["GEMINI_API_KEY"],
};

export default ttsGeminiAgentInfo;