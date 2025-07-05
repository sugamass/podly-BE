import {
  AudioPreviewUseCaseInput,
  AudioPreviewUseCaseOutput,
  AudioScriptData,
  TTSProvider,
} from "../../domain/audio/entities/AudioEntity";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";
import { promises as fsPromise } from "fs";
import { GraphAI, GraphData } from "graphai";
import * as agents from "@graphai/agents";
import addBGMAgent from "../../infrastructure/agents/add_bgm_agent";
import combineFilesAgent from "../../infrastructure/agents/combine_files_agent";
import createDataForHlsAgent from "../../infrastructure/agents/create_data_for_hls_agent";
import waitForFileAgent from "../../infrastructure/agents/wait_for_file_agent";
import { ttsOpenaiAgent } from "@graphai/tts_openai_agent";
import { pathUtilsAgent } from "@graphai/vanilla_node_agents";
import customTtsOpenaiAgent from "../../infrastructure/agents/custom_tts_openai_agent";

// 型定義
interface ScriptData {
  speaker: string;
  text: string;
  filename?: string;
}

interface PodcastScript {
  id: string;
  tts: string;
  voices: string[];
  speakers: string[];
  script: AudioScriptData[];
  filename: string;
  voicemap: any;
  ttsAgent: string;
  padding?: any;
  imageInfo: any[];
}

type AgentFilterFunction = (context: any, next: any) => Promise<any>;

/**
 * 音声プレビューUseCase
 */
export class AudioPreviewUseCase {
  async execute(
    request: AudioPreviewUseCaseInput
  ): Promise<AudioPreviewUseCaseOutput> {
    console.log("🚀 AudioPreviewUseCase started");
    console.log("📋 Request:", JSON.stringify(request, null, 2));

    try {
      // 音声プレビュー生成処理
      const previewResult = await this.generateAudioPreview(request);

      console.log("✅ AudioPreviewUseCase completed");
      console.log("📤 Result:", JSON.stringify(previewResult, null, 2));

      return previewResult;
    } catch (error) {
      console.error("💥 Error in AudioPreviewUseCase:", error);
      throw error;
    }
  }

  private async generateAudioPreview(
    request: AudioPreviewUseCaseInput
  ): Promise<AudioPreviewUseCaseOutput> {
    if (!request.scriptId) {
      request.scriptId = uuidv4();
    }

    const filename = request.scriptId.replace(/-/g, "_");

    request.script.forEach((element: AudioScriptData, index: number) => {
      (element as any).filename = filename + index;
    });

    let ttsApiKey: string;
    ttsApiKey = process.env.OPENAI_API_KEY ?? "";

    let podcasterConcurrency = 8;
    let ttsAgent: string;

    request.voices = request.voices ?? ["shimmer", "echo"];
    ttsAgent = "customTtsOpenaiAgent";

    const voicemap = request.speakers?.reduce(
      (map: any, speaker: string, index: number) => {
        map[speaker] = request.voices![index];
        return map;
      },
      {}
    );

    // 環境に応じたパス設定
    const isLambda =
      process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT;

    let basePath: string;
    if (isLambda) {
      basePath = "/tmp";
    } else {
      // ローカル開発環境: podly-lambda/functions/createPreviewAudio から見て ../../../ がpodly-BEルート
      basePath = path.resolve(process.cwd(), "../../../");
    }

    const separatedAudioDir = path.join(basePath, "tmp_separated_audio");
    const scratchpadDir = path.join(basePath, "scratchpad");
    const outputStorageDir = path.join(basePath, "tmp_output_storage");
    const musicDir = path.join(basePath, "music");

    const m3u8fileUrl =
      process.env.STORAGE_URL ??
      "http://localhost:3000/" + "stream/" + filename + ".m3u8";

    const openaiTtsModel = "tts-1"; // 標準モデル

    const podcastScript: PodcastScript = {
      id: request.scriptId,
      tts: request.tts,
      voices: request.voices,
      speakers: request.speakers,
      script: request.script,
      filename: filename,
      voicemap: voicemap,
      ttsAgent: ttsAgent,
      padding: undefined,
      imageInfo: [],
    };

    const graphTts: GraphData = {
      nodes: {
        path: {
          agent: "pathUtilsAgent",
          params: {
            method: "resolve",
          },
          inputs: {
            dirs: [separatedAudioDir, "${:row.filename}.mp3"],
          },
        },
        voice: {
          agent: (namedInputs: any) => {
            const { speaker, voicemap, voice0 } = namedInputs;
            return voicemap[speaker] ?? voice0;
          },
          inputs: {
            speaker: ":row.speaker",
            voicemap: ":script.voicemap",
            voice0: ":script.voices.$0",
          },
        },
        tts: {
          agent: ":script.ttsAgent",
          inputs: {
            text: ":row.text",
            file: ":path.path",
            voice: ":voice",
          },
          params: {
            throwError: true,
            apiKey: ttsApiKey,
            model: openaiTtsModel,
          },
        },
      },
    };

    const graphPodcaster: GraphData = {
      version: 0.6,
      concurrency: podcasterConcurrency,
      nodes: {
        map: {
          agent: "mapAgent",
          inputs: { rows: ":script.script", script: ":script" },
          graph: graphTts,
        },
        combineFiles: {
          agent: "combineFilesAgent",
          inputs: {
            map: ":map",
            script: ":script",
            outputFilePath: path.join(scratchpadDir, "${:script.filename}.mp3"),
          },
          isResult: true,
        },
        addBGM: {
          agent: "addBGMAgent",
          params: {
            musicFileName: path.join(musicDir, "StarsBeyondEx.mp3"),
          },
          inputs: {
            voiceFile: ":combineFiles.outputFile",
            outputFilePath: path.join(
              scratchpadDir,
              "${:script.filename}_bgm.mp3"
            ),
            script: ":script",
          },
          isResult: true,
        },
        title: {
          agent: "copyAgent",
          params: {
            namedKey: "title",
          },
          inputs: {
            title: "Audio Preview Generated",
            waitFor: ":addBGM",
          },
          isResult: true,
        },
      },
    };

    const podcastGraphData: GraphData = {
      version: 0.6,
      concurrency: 8,
      nodes: {
        script: {
          value: {},
        },
        aiPodcaster: {
          agent: "nestedAgent",
          inputs: {
            script: ":script",
          },
          graph: graphPodcaster,
        },
        convertData: {
          agent: "createDataForHlsAgent",
          params: {
            outputDir: process.env.TS_OUTPUT_DIR ?? outputStorageDir,
            ifDeleteInput: false,
          },
          inputs: {
            inputFilePath: ":aiPodcaster.addBGM.outputFile",
            outputBaseName: ":script.filename",
          },
        },
        waitForOutput: {
          agent: "waitForFileAgent",
          params: {
            outputDir: process.env.TS_OUTPUT_DIR ?? outputStorageDir,
            timeout: 5000,
          },
          inputs: { fileName: ":convertData.fileName" },
        },
        output: {
          agent: (namedInputs: any) => {
            const { fileName, mp3Urls } = namedInputs;
            console.log("fileName:", fileName);
            console.log("mp3Urls:", mp3Urls);
            return { fileName, mp3Urls };
          },
          inputs: {
            fileName: ":convertData.fileName",
            waitfor: ":waitForOutput",
            mp3Urls: ":aiPodcaster.combineFiles.mp3Urls",
          },
          if: ":waitForOutput",
          isResult: true,
        },
      },
    };

    const fileCacheAgentFilter: AgentFilterFunction = async (context, next) => {
      const { namedInputs } = context;
      const { file } = namedInputs;

      try {
        await fsPromise.access(file);
        console.log(
          "cache hit (will overwrite): " + file,
          namedInputs.text.slice(0, 10)
        );
        // キャッシュがあっても処理を続ける（上書き用）
      } catch {
        console.log("no cache, creating new file: " + file);
      }

      // キャッシュの有無に関係なく next を実行して buffer を取得
      const output = (await next(context)) as Record<string, any>;
      const buffer = output ? output["buffer"] : undefined;

      if (buffer) {
        console.log("writing (overwriting): " + file);
        await fsPromise.writeFile(file, buffer);
        return true;
      }

      console.log("no buffer returned: " + file);
      return false;
    };

    const agentFilters = [
      {
        name: "fileCacheAgentFilter",
        agent: fileCacheAgentFilter,
        nodeIds: ["tts"],
      },
    ];

    const podcastGraph = new GraphAI(
      podcastGraphData,
      {
        ...agents,
        ttsOpenaiAgent,
        addBGMAgent,
        combineFilesAgent,
        createDataForHlsAgent,
        waitForFileAgent,
        pathUtilsAgent,
        customTtsOpenaiAgent,
      },
      { agentFilters }
    );

    podcastGraph.injectValue("script", podcastScript);

    const graphResult = await podcastGraph.run();
    const errors = podcastGraph.errors();
    console.log("graphResult:", graphResult);

    if (errors && Array.isArray(errors) && errors.length > 0) {
      console.error("GraphAI errors:", errors);
      throw new Error(`GraphAI execution failed: ${JSON.stringify(errors[0])}`);
    }

    let fileName = "";
    let mp3filenames: string[] = [];
    for (const [_, value] of Object.entries(graphResult)) {
      if (typeof value === "object" && value !== null) {
        for (const [key2, value2] of Object.entries(
          value as Record<string, any>
        )) {
          if (key2 == "fileName") {
            fileName = value2 as string;
          } else if (key2 == "mp3Urls") {
            mp3filenames = value2 as string[];
          }
        }
      }
    }

    // 実際の音声生成結果を返す
    const previewResult: AudioPreviewUseCaseOutput = {
      audioUrl: m3u8fileUrl,
      separatedAudioUrls: mp3filenames,
      scriptId: request.scriptId,
    };

    return previewResult;
  }
}
