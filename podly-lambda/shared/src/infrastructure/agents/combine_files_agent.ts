import { AgentFunction, AgentFunctionInfo } from "graphai";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { PodcastScript } from "./type";

// 環境に応じたffmpegパスの設定
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

const combineFilesAgent: AgentFunction<
  null, // params
  Record<string, any>, // output
  { script: PodcastScript; outputFilePath: string } // input
> = async ({ namedInputs }) => {
  const { script, outputFilePath } = namedInputs;

  // 環境に応じたパス設定
  const isLambda =
    process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT;

  let basePath: string;
  if (isLambda) {
    basePath = "/tmp";
  } else {
    // ローカル開発環境: 実行時のカレントディレクトリから見て ../../../ がpodly-BEルート
    basePath = path.resolve(process.cwd(), "../../../");
  }

  const musicDir = path.join(basePath, "music");
  const separatedAudioDir = path.join(basePath, "tmp_separated_audio");

  const silentPath = path.join(musicDir, "silent300.mp3");
  const silentLastPath = path.join(musicDir, "silent800.mp3");
  const scratchpadDir = path.join(basePath, "scratchpad");
  const scratchpadFilePaths: string[] = [];
  const mp3filenames: string[] = script.script.map(
    (element: any) => `${element.filename}.mp3`
  );

  const command = ffmpeg();
  script.script.forEach((element: any, index: number) => {
    const filePath = path.join(separatedAudioDir, element.filename + ".mp3");
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
  } finally {
    // scratchpad 内のファイルを削除
    // try {
    //   await Promise.all(
    //     scratchpadFilePaths.map(async (file) => {
    //       try {
    //         await fs.promises.unlink(file);
    //         console.log(`Deleted: ${file}`);
    //       } catch (unlinkError) {
    //         console.error(`Error deleting file ${file}:`, unlinkError);
    //       }
    //     })
    //   );
    // } catch (cleanupError) {
    //   console.error("Error while cleaning up scratchpad files:", cleanupError);
    // }
  }

  return { outputFile: outputFilePath, mp3Urls: mp3filenames };
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
