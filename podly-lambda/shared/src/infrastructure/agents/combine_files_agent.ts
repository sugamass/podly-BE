import { AgentFunction, AgentFunctionInfo } from "graphai";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { PodcastScript } from "./type";
import { S3Uploader } from "../../utils/s3Upload";

// 環境に応じたffmpegパスの設定
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

const combineFilesAgent: AgentFunction<
  { musicDir: string }, // params
  Record<string, any>, // output
  {
    script: PodcastScript;
    inputDir: string;
    outputFilePath: string;
  } // input
> = async ({ namedInputs, params }) => {
  const { script, inputDir, outputFilePath } = namedInputs;
  const { musicDir } = params;

  // 環境に応じたパス設定
  const isLambda =
    process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT;

  let silentPath: string;
  let silentLastPath: string;

  if (isLambda) {
    // Lambda環境では、S3からmusicファイルを取得
    try {
      // musicディレクトリを作成
      await fs.promises.mkdir(musicDir, { recursive: true });

      // S3から音楽ファイルをダウンロード（音楽ファイル専用バケットを使用）
      silentPath = await S3Uploader.downloadMusicFileFromMusicBucket(
        "silent300.mp3",
        musicDir
      );
      silentLastPath = await S3Uploader.downloadMusicFileFromMusicBucket(
        "silent800.mp3",
        musicDir
      );
    } catch (error) {
      console.error("Failed to download music files from S3:", error);
      throw error;
    }
  } else {
    // ローカル環境では既存のパスを使用
    silentPath = path.join(musicDir, "silent300.mp3");
    silentLastPath = path.join(musicDir, "silent800.mp3");
  }

  const scratchpadFilePaths: string[] = [];
  const mp3filenames: string[] = script.script.map(
    (element: any) => `${element.filename}.mp3`
  );

  const command = ffmpeg();
  script.script.forEach((element: any, index: number) => {
    const filePath = path.join(inputDir, element.filename + ".mp3");
    scratchpadFilePaths.push(filePath);
    const isLast = index === script.script.length - 2;
    command.input(filePath);
    command.input(isLast ? silentLastPath : silentPath);
    // Measure and log the timestamp of each section
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error("Error while getting metadata:", err);
      } else {
        element["duration"] = metadata.format.duration! + (isLast ? 0.8 : 0.3);
      }
    });
  });

  try {
    await new Promise((resolve, reject) => {
      command
        .on("end", () => {
          console.log("MP3 files have been successfully combined.");
          resolve(0);
        })
        .on("error", (err: any) => {
          console.error("Error while combining MP3 files:", err);
          reject(err);
        })
        .mergeToFile(outputFilePath, path.dirname(outputFilePath));
    });
  } catch (error) {
    console.error("An error occurred:", error);
  }

  return { outputFilePath, mp3Urls: mp3filenames };
};

const combineFilesAgentInfo: AgentFunctionInfo = {
  name: "combineFilesAgent",
  agent: combineFilesAgent,
  mock: combineFilesAgent,
  samples: [],
  description: "combineFilesAgent",
  category: ["ffmpeg"],
  author: "satoshi nakajima",
  repository: "https://github.com/snakajima/ai-podcaster",
  license: "MIT",
};

export default combineFilesAgentInfo;
