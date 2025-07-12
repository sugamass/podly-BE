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
import uploadS3Agent from "../../infrastructure/agents/upload_s3_agent";

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
    const isLambda = !!(
      process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT
    );

    console.log("isLambda:", isLambda);

    const basePath = isLambda
      ? "/tmp"
      : path.resolve(process.cwd(), "../../../tmp");

    // TOO: separated, fullそれぞれのURL出力エージェント

    // TTSでmp3音声ファイル生成直後の一時保存用フォルダ
    const separatedMp3Dir = path.join(
      basePath,
      request.scriptId,
      "tmp_separated_mp3"
    );
    // ビートごとのmp3ファイルをHLSに変換したファイルを保存するフォルダ
    const separatedHlsDir = path.join(
      basePath,
      request.scriptId,
      "tmp_separated_hls"
    );
    // 音声ファイルを結合した一時保存用フォルダ
    const fullMp3Dir = path.join(basePath, request.scriptId, "tmp_full_mp3");
    // ローカル用HLSファイル保存フォルダ
    const fullHlsDir = path.join(basePath, request.scriptId, "tmp_full_hls");

    const musicDir = path.join(basePath, "music");

    // Lambda環境では必要なディレクトリを作成

    await fsPromise.mkdir(separatedMp3Dir, { recursive: true });
    await fsPromise.mkdir(separatedHlsDir, { recursive: true });
    await fsPromise.mkdir(fullMp3Dir, { recursive: true });
    await fsPromise.mkdir(fullHlsDir, { recursive: true });
    await fsPromise.mkdir(musicDir, { recursive: true });

    // TODO モデルを変更できるようにする
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
        separateMp3Path: {
          agent: "pathUtilsAgent",
          params: {
            method: "resolve",
          },
          inputs: {
            dirs: [separatedMp3Dir, "${:row.filename}.mp3"],
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
            voice: ":voice",
          },
          params: {
            throwError: true,
            apiKey: ttsApiKey,
            model: openaiTtsModel,
          },
        },
        writeFile: {
          agent: async (namedInputs: any) => {
            const { file, buffer } = namedInputs;
            if (buffer) {
              await fsPromise.writeFile(file, buffer);
              return { outputFilePath: file };
            } else {
              throw new Error("No buffer returned");
            }
          },
          inputs: {
            file: ":separateMp3Path.path",
            buffer: ":tts.buffer",
          },
          isResult: true,
        },
        convertData: {
          agent: "createDataForHlsAgent",
          params: {
            outputDir: separatedHlsDir,
            ifDeleteInput: false,
          },
          inputs: {
            inputFilePath: ":writeFile.outputFilePath",
            outputBaseName: ":row.filename",
          },
        },
        waitForHls: {
          agent: "waitForFileAgent",
          params: {
            outputDir: separatedHlsDir,
          },
          inputs: { fileName: "${:row.filename}.m3u8" },
          isResult: true,
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
        uploadSeparatedAudio: {
          agent: "uploadS3Agent",
          params: {
            isLambda: isLambda,
          },
          inputs: {
            directoryPath: separatedHlsDir,
            s3Prefix: "tmp_separated_hls",
            // 待機用
            waitFor: ":map",
          },
          isResult: true,
        },
        combineFiles: {
          agent: "combineFilesAgent",
          params: {
            musicDir: musicDir,
          },
          inputs: {
            inputDir: separatedMp3Dir,
            map: ":map",
            script: ":script",
            outputFilePath: path.join(fullMp3Dir, "${:script.filename}.mp3"),
          },
        },
        addBGM: {
          agent: "addBGMAgent",
          inputs: {
            voiceFilePath: ":combineFiles.outputFilePath",
            outputFilePath: path.join(
              fullMp3Dir,
              "${:script.filename}_bgm.mp3"
            ),
            script: ":script",
          },
          params: {
            musicDir: musicDir,
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
      version: 2.0,
      concurrency: 8,
      nodes: {
        script: {
          value: {},
        },
        isLambda: {
          value: {},
        },
        aiPodcaster: {
          agent: "nestedAgent",
          inputs: {
            script: ":script",
            isLambda: ":isLambda",
          },
          graph: graphPodcaster,
        },
        convertData: {
          agent: "createDataForHlsAgent",
          params: {
            outputDir: fullHlsDir,
            ifDeleteInput: true,
          },
          inputs: {
            inputFilePath: ":aiPodcaster.addBGM.outputFilePath",
            outputBaseName: ":script.filename",
          },
        },
        waitForOutput: {
          agent: "waitForFileAgent",
          params: {
            outputDir: fullHlsDir,
            timeout: 15000,
          },
          inputs: { fileName: "${:script.filename}.m3u8" },
        },
        uploadFullAudio: {
          agent: "uploadS3Agent",
          params: {
            isLambda: isLambda,
          },
          inputs: {
            directoryPath: fullHlsDir,
            s3Prefix: "tmp_full_hls",
            waitFor: ":waitForOutput",
          },
        },
        // TODO：署名付きURLを生成するエージェントを作成する
        output: {
          agent: (namedInputs: any) => {
            const { fileName, uploadResults, separatedAudioResults } =
              namedInputs;
            console.log("fileName:", fileName);
            console.log("uploadResults:", uploadResults);
            console.log("separatedAudioResults:", separatedAudioResults);

            // TODO CloudFrontで配信する署名付きURLを生成する
            const fullAudioUrl = uploadResults.map((result: any) => result.url);

            const separatedAudioUrls = separatedAudioResults.map(
              (result: any) => result.url
            );

            return { fileName, fullAudioUrl, separatedAudioUrls };
          },
          inputs: {
            fileName: ":convertData.fileName",
            uploadResults: ":uploadFullAudio.results",
            separatedAudioResults: ":aiPodcaster.uploadSeparatedAudio.results",
            waitfor: ":waitForOutput",
          },
          isResult: true,
        },
      },
    };

    // // bufferをファイルに書き込むエージェントフィルター
    // const fileCacheAgentFilter: AgentFilterFunction = async (context, next) => {
    //   const { namedInputs } = context;
    //   const { file } = namedInputs;

    //   // キャッシュの有無に関係なく next を実行して buffer を取得
    //   const output = (await next(context)) as Record<string, any>;
    //   const buffer = output ? output["buffer"] : undefined;

    //   if (buffer) {
    //     console.log("writing: " + file);
    //     await fsPromise.writeFile(file, buffer);
    //     return true;
    //   }

    //   console.log("no buffer returned: " + file);
    //   return false;
    // };

    // const agentFilters = [
    //   {
    //     name: "fileCacheAgentFilter",
    //     agent: fileCacheAgentFilter,
    //     nodeIds: ["tts"],
    //   },
    // ];

    const podcastGraph = new GraphAI(podcastGraphData, {
      ...agents,
      ttsOpenaiAgent,
      addBGMAgent,
      combineFilesAgent,
      createDataForHlsAgent,
      waitForFileAgent,
      pathUtilsAgent,
      customTtsOpenaiAgent,
      uploadS3Agent,
    });

    podcastGraph.injectValue("script", podcastScript);
    podcastGraph.injectValue("isLambda", isLambda);

    const graphResult = await podcastGraph.run();

    //
    const errors = podcastGraph.errors();
    console.log("errorsssssss:", errors);
    console.log("graphResult:", graphResult);

    if (errors && Array.isArray(errors) && errors.length > 0) {
      console.error("GraphAI errors:", errors);
      throw new Error(`GraphAI execution failed: ${JSON.stringify(errors[0])}`);
    }

    let fileName = "";
    let separatedAudioUrls: string[] = [];
    let fullAudioUrl = "";

    for (const [_, value] of Object.entries(graphResult)) {
      if (typeof value === "object" && value !== null) {
        for (const [key2, value2] of Object.entries(
          value as Record<string, any>
        )) {
          if (key2 == "fileName") {
            fileName = value2 as string;
          } else if (key2 == "separatedAudioUrls") {
            separatedAudioUrls = value2 as string[];
          } else if (key2 == "s3Url") {
            fullAudioUrl = value2 as string;
          }
        }
      }
    }

    // S3のURLが取得できた場合はそちらを使用、そうでなければ既存のURL
    const finalAudioUrl =
      fullAudioUrl || "http://localhost:3000/stream/" + filename + ".m3u8";

    // 実際の音声生成結果を返す
    const previewResult: AudioPreviewUseCaseOutput = {
      audioUrl: finalAudioUrl,
      separatedAudioUrls: separatedAudioUrls,
      scriptId: request.scriptId,
    };

    console.log("previewResult:", previewResult);

    return previewResult;
  }
}
