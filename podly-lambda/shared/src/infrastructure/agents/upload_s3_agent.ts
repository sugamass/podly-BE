import { AgentFunction, AgentFunctionInfo } from "graphai";
import { S3Uploader, getS3ConfigFromEnv } from "../../utils/s3Upload";
import fs from "fs";
import path from "path";

const uploadS3Agent: AgentFunction<
  { isLambda: boolean }, // params
  {
    results: Array<{ key: string; url: string }>;
    success: boolean;
    uploadedCount: number;
  }, // output
  {
    directoryPath: string;
    s3Prefix: string;
    waitFor: any;
  } // input
> = async ({ namedInputs, params }) => {
  const { directoryPath, s3Prefix } = namedInputs;
  const { isLambda } = params;

  if (!isLambda) {
    return {
      results: [
        {
          key: "local-test",
          url: "local-test",
        },
      ],
      success: true,
      uploadedCount: 0,
    };
  }

  try {
    // S3設定を環境変数から取得
    const s3Config = getS3ConfigFromEnv();
    const s3Uploader = new S3Uploader(s3Config);

    // ディレクトリの存在確認
    const stats = await fs.promises.stat(directoryPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${directoryPath}`);
    }

    // ディレクトリ内のファイルをアップロード
    const uploadResults = await s3Uploader.uploadDirectory(
      directoryPath,
      s3Prefix
    );

    console.log(
      `Successfully uploaded ${uploadResults.length} files from directory`
    );

    // .m3u8ファイルのみを出力結果としてフィルタリング
    const m3u8Results = uploadResults.filter((result) =>
      result.key.endsWith(".m3u8")
    );

    return {
      results: m3u8Results,
      success: true,
      uploadedCount: uploadResults.length,
    };
  } catch (error) {
    console.error(`Failed to upload directory to S3:`, error);
    throw error;
  }
};

const uploadS3AgentInfo: AgentFunctionInfo = {
  name: "uploadS3Agent",
  agent: uploadS3Agent,
  mock: uploadS3Agent,
  samples: [
    {
      inputs: {
        directoryPath: "/tmp/hls_output",
        s3Prefix: "hls/episode-001",
        cleanup: true,
      },
      params: {},
      result: {
        results: [
          {
            key: "hls/episode-001/playlist.m3u8",
            url: "https://bucket.s3.amazonaws.com/hls/episode-001/playlist.m3u8",
          },
        ],
        success: true,
        uploadedCount: 2,
      },
    },
  ],
  description:
    "Upload entire directories to S3 storage with optional local file cleanup. Returns only .m3u8 file paths in results.",
  category: ["storage", "s3"],
  author: "podly team",
  repository: "https://github.com/podly/podly-BE",
  license: "MIT",
};

export default uploadS3AgentInfo;
