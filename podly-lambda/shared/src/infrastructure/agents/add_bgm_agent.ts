import { AgentFunction, AgentFunctionInfo } from "graphai";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { PodcastScript } from "./type";
import fs from "fs";
import { S3Uploader, getS3ConfigFromEnv } from "../../utils/s3Upload";

// 環境に応じたffmpegパスの設定
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

const addBGMAgent: AgentFunction<
  { musicDir: string },
  { outputFilePath: string },
  { voiceFilePath: string; outputFilePath: string; script: PodcastScript }
> = async ({ namedInputs, params }) => {
  const { voiceFilePath, outputFilePath, script } = namedInputs;

  const { musicDir } = params;

  const isLambda =
    process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT;

  let musicFilePath: string;
  if (isLambda) {
    try {
      const s3Config = getS3ConfigFromEnv();
      const s3Uploader = new S3Uploader(s3Config);

      // S3からBGMファイルをダウンロード
      musicFilePath = await s3Uploader.downloadMusicFile(
        "StarsBeyondEx.mp3",
        musicDir
      );
    } catch (error) {
      console.error("Failed to download BGM file from S3:", error);
      throw error;
    }
  } else {
    // ローカル環境ではローカルディレクトリから取得
    musicFilePath = path.join(
      path.join(process.cwd(), "../../../"),
      "music",
      "StarsBeyondEx.mp3"
    );
  }

  const deleteVoiceFile = async () => {
    try {
      await fs.promises.unlink(voiceFilePath);
      console.log(`Deleted voice file: ${voiceFilePath}`);
    } catch (err) {
      console.error(`Failed to delete voice file: ${voiceFilePath}`, err);
    }
  };

  // const promise = new Promise((resolve, reject) => {
  //   ffmpeg.ffprobe(voiceFile, (err, metadata) => {
  //     if (err) {
  //       console.error("Error getting metadata: " + err.message);
  //       return reject(err);
  //     }

  //     const speechDuration = metadata.format.duration;
  //     const padding = script.padding ?? 4000; // msec
  //     const totalDuration =
  //       (padding * 2) / 1000 + Math.round(speechDuration ?? 0);
  //     console.log("totalDuration:", speechDuration, totalDuration);

  //     const command = ffmpeg();
  //     command
  //       .input(musicFile)
  //       .input(voiceFile)
  //       .complexFilter([
  //         // 音声に delay をかけ、音量を上げる
  //         `[1:a]adelay=${padding}|${padding},volume=4[a1]`,
  //         // 背景音楽の音量を下げる
  //         `[0:a]volume=0.2[a0]`,
  //         // 両者をミックスする
  //         `[a0][a1]amix=inputs=2:duration=longest:dropout_transition=3[amixed]`,
  //         // 出力をトリムする
  //         `[amixed]atrim=start=0:end=${totalDuration}[trimmed]`,
  //         // フェードアウトを適用し、最終出力にラベル [final] を付与
  //         `[trimmed]afade=t=out:st=${totalDuration - padding / 1000}:d=${
  //           padding / 1000
  //         }[final]`,
  //       ])
  //       .outputOptions(["-map", "[final]"])
  //       .on("error", (err) => {
  //         console.error("Error: " + err.message);
  //         reject(err);
  //       })
  //       .on("end", () => {
  //         console.log("File has been created successfully");
  //         resolve(0);
  //       })
  //       .save(outputFile);
  //   });
  // });
  // await promise;

  // return outputFile;
  try {
    await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(voiceFilePath, (err, metadata) => {
        if (err) {
          console.error("Error getting metadata: " + err.message);
          return reject(err);
        }

        const speechDuration = metadata.format.duration;
        const padding = script.padding ?? 4000; // msec
        const totalDuration =
          (padding * 2) / 1000 + Math.round(speechDuration ?? 0);
        console.log("totalDuration:", speechDuration, totalDuration);

        const command = ffmpeg();
        command
          .input(musicFilePath)
          .input(voiceFilePath)
          .complexFilter([
            // 音声に delay をかけ、音量を上げる
            `[1:a]adelay=${padding}|${padding},volume=4[a1]`,
            // 背景音楽の音量を下げる
            `[0:a]volume=0.2[a0]`,
            // 両者をミックスする
            `[a0][a1]amix=inputs=2:duration=longest:dropout_transition=3[amixed]`,
            // 出力をトリムする
            `[amixed]atrim=start=0:end=${totalDuration}[trimmed]`,
            // フェードアウトを適用し、最終出力にラベル [final] を付与
            `[trimmed]afade=t=out:st=${totalDuration - padding / 1000}:d=${
              padding / 1000
            }[final]`,
          ])
          .outputOptions(["-map", "[final]"])
          .on("error", (err) => {
            console.error("Error: " + err.message);
            reject(err);
          })
          .on("end", () => {
            console.log("File has been created successfully");
            resolve(0);
          })
          .save(outputFilePath);
      });
    });
  } finally {
    await deleteVoiceFile();
  }

  return { outputFilePath: outputFilePath };
};

const addBGMAgentInfo: AgentFunctionInfo = {
  name: "addBGMAgent",
  agent: addBGMAgent,
  mock: addBGMAgent,
  samples: [],
  description: "addBGMAgent",
  category: ["ffmpeg"],
  author: "satoshi nakajima",
  repository: "https://github.com/snakajima/ai-podcaster",
  license: "MIT",
};

export default addBGMAgentInfo;
