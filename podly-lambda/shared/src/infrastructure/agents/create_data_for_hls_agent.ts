import { AgentFunction, AgentFunctionInfo } from "graphai";
import ffmpeg from "fluent-ffmpeg";
import * as path from "path";

// const createDataForHlsAgent: AgentFunction = async ({
//   params,
//   namedInputs,
// }) => {
//   const { outputDir } = params;
//   const { inputFilePath, outputBaseName } = namedInputs;

//   const hlsOptions = {
//     segmentTime: 10,
//     listSize: 0,
//     filePattern: `${outputBaseName}_%03d.ts`,
//     playlistName: `${outputBaseName}.m3u8`,
//     outputDir: outputDir,
//   };

//   // 環境に応じたffmpegパスの設定
//   if (process.env.FFMPEG_PATH) {
//     ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
//   }
//   if (process.env.FFPROBE_PATH) {
//     ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
//   }

//   try {
//     // HLS生成処理
//     await new Promise((resolve, reject) => {
//       ffmpeg(inputFilePath)
//         .outputOptions([
//           "-y",
//           "-codec: copy",
//           `-hls_time ${hlsOptions.segmentTime}`,
//           `-hls_list_size ${hlsOptions.listSize}`,
//           `-hls_segment_filename ${path.join(
//             hlsOptions.outputDir,
//             hlsOptions.filePattern
//           )}`,
//         ])
//         .output(path.join(hlsOptions.outputDir, hlsOptions.playlistName))
//         .on("start", (commandLine) => {
//           console.log("FFmpeg command:", commandLine);
//         })
//         .on("progress", (progress) => {
//           console.log("progress:", progress);
//         })
//         .on("end", () => {
//           console.log("HLS generation completed");
//           resolve({ fileName: hlsOptions.playlistName });
//         })
//         .on("error", (err) => {
//           console.error("FFmpeg error:", err);
//           reject(err);
//         })
//         .run();
//     });

//     return { outputFilePath: outputDir + "/" + hlsOptions.playlistName };
//   } catch (error) {
//     console.error("Failed to create HLS data:", error);
//     throw error;
//   }
// };

const createDataForHlsAgent: AgentFunction = async ({
  params,
  namedInputs,
}) => {
  const { outputDir } = params;
  const { inputFilePath, outputBaseName } = namedInputs;

  const hlsOptions = {
    segmentTime: 6, // 推奨: 4〜6秒
    listSize: 0, // VOD: 0で全セグメント掲載（ENDLIST付与）
    filePattern: `${outputBaseName}_%03d.ts`,
    playlistName: `${outputBaseName}.m3u8`,
    outputDir,
  };

  if (process.env.FFMPEG_PATH) ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
  if (process.env.FFPROBE_PATH) ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);

  await new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      // ★ 互換性重視：AACに変換
      .audioCodec("aac")
      .audioBitrate("128k")
      .format("hls")
      .outputOptions([
        "-y",
        "-ac 2", // ステレオ（必要に応じて変更）
        `-hls_time ${hlsOptions.segmentTime}`,
        `-hls_list_size ${hlsOptions.listSize}`,
        "-hls_flags independent_segments", // セグメント先頭にキーフレーム
        `-hls_segment_filename ${path.join(
          hlsOptions.outputDir,
          hlsOptions.filePattern
        )}`,
        "-preset veryfast", // 速度優先(必要に応じて調整)
        "-movflags +faststart", // 先頭メタ先送り最適化
      ])
      .output(path.join(hlsOptions.outputDir, hlsOptions.playlistName))
      .on("start", (cmd) => console.log("FFmpeg:", cmd))
      .on("progress", (p) => console.log("progress:", p))
      .on("end", () => resolve(null))
      .on("error", (err) => reject(err))
      .run();
  });

  return { outputFilePath: path.join(outputDir, hlsOptions.playlistName) };
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
