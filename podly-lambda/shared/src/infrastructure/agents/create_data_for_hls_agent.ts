import { AgentFunction, AgentFunctionInfo } from "graphai";
import ffmpeg from "fluent-ffmpeg";
import * as path from "path";
import fs from "fs";

const createDataForHlsAgent: AgentFunction = async ({
  params,
  namedInputs,
}) => {
  const { outputDir, ifDeleteInput } = params;
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
          console.log("end");
          resolve({ fileName: hlsOptions.playlistName });
        })
        .on("error", (err) => {
          console.error("error:", err);
          reject(err);
        })
        .run();
    });
  } finally {
    if (ifDeleteInput) {
      await deleteInputFile();
    }
  }

  return { fileName: hlsOptions.playlistName };
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
