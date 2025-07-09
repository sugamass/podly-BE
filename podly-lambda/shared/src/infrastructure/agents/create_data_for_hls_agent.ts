import { AgentFunction, AgentFunctionInfo } from "graphai";
import ffmpeg from "fluent-ffmpeg";
import * as path from "path";
import fs from "fs";
import { S3Uploader, getS3ConfigFromEnv } from "../../utils/s3Upload";

const createDataForHlsAgent: AgentFunction = async ({
  params,
  namedInputs,
}) => {
  const { ifDeleteInput, outputDir } = params;
  const { inputFilePath, outputBaseName } = namedInputs;

  const hlsOptions = {
    segmentTime: 10,
    listSize: 0,
    filePattern: `${outputBaseName}_%03d.ts`,
    playlistName: `${outputBaseName}.m3u8`,
    outputDir: outputDir,
  };

  // 環境に応じたffmpegパスの設定
  if (process.env.FFMPEG_PATH) {
    ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
  }
  if (process.env.FFPROBE_PATH) {
    ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
  }

  const deleteInputFile = async () => {
    try {
      await fs.promises.unlink(inputFilePath);
      console.log(`Deleted input file: ${inputFilePath}`);
    } catch (err) {
      console.error(`Failed to delete input file: ${inputFilePath}`, err);
    }
  };

  try {
    // HLS生成処理
    await new Promise((resolve, reject) => {
      ffmpeg(inputFilePath)
        .outputOptions([
          "-y",
          "-codec: copy",
          `-hls_time ${hlsOptions.segmentTime}`,
          `-hls_list_size ${hlsOptions.listSize}`,
          `-hls_segment_filename ${path.join(
            hlsOptions.outputDir,
            hlsOptions.filePattern
          )}`,
        ])
        .output(path.join(hlsOptions.outputDir, hlsOptions.playlistName))
        .on("start", (commandLine) => {
          console.log("FFmpeg command:", commandLine);
        })
        .on("progress", (progress) => {
          console.log("progress:", progress);
        })
        .on("end", () => {
          console.log("HLS generation completed");
          resolve({ fileName: hlsOptions.playlistName });
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          reject(err);
        })
        .run();
    });

    // // S3アップロード処理
    // if (useS3) {
    //   try {
    //     const s3Config = getS3ConfigFromEnv();
    //     const s3Uploader = new S3Uploader(s3Config);

    //     // HLSファイル（セグメント化された音声）のS3キーのプレフィックス
    //     const hlsS3Prefix = `tmp/audio_fulll/${outputBaseName}`;

    //     console.log(`Uploading HLS files to S3: ${hlsS3Prefix}`);
    //     const uploadResult = await s3Uploader.uploadHlsFiles(
    //       hlsOptions.outputDir,
    //       outputBaseName,
    //       hlsS3Prefix
    //     );

    //     console.log("S3 upload completed:", uploadResult.playlistUrl);

    //     // ローカルファイルを削除
    //     const localFiles = await fs.promises.readdir(hlsOptions.outputDir);
    //     const hlsFiles = localFiles
    //       .filter((file) => file.startsWith(outputBaseName))
    //       .map((file) => path.join(hlsOptions.outputDir, file));

    //     await s3Uploader.cleanupLocalFiles(hlsFiles);

    //     return {
    //       fileName: hlsOptions.playlistName,
    //       s3Url: uploadResult.playlistUrl,
    //       segmentUrls: uploadResult.segmentUrls,
    //     };
    //   } catch (s3Error) {
    //     console.error("S3 upload failed:", s3Error);
    //     // S3アップロードに失敗した場合はローカルファイルを返す
    //     return { fileName: hlsOptions.playlistName };
    //   }
    // }

    return { outputFilePath: outputDir + "/" + hlsOptions.playlistName };
  } finally {
    if (ifDeleteInput) {
      await deleteInputFile();
    }
  }
};

const sampleInput = {
  inputFilePath: "src/graphaiTools/agent/test/input/sample.mp3",
  outputBaseName: "sample",
};
const sampleParams = {
  outputDir: "src/graphaiTools/agent/test/output",
};
const sampleResult = {
  outputPath: "src/graphaiTools/agent/test/output/sample.m3u8",
};

const createDataForHlsAgentInfo: AgentFunctionInfo = {
  name: "createDataForHlsAgent",
  agent: createDataForHlsAgent,
  mock: createDataForHlsAgent,
  samples: [
    {
      inputs: sampleInput,
      params: sampleParams,
      result: sampleResult,
    },
  ],
  description: "Create data for HLS",
  category: ["ffmpeg"],
  author: "Kazumasa Sugawara",
  repository: "",
  license: "",
};

export default createDataForHlsAgentInfo;
