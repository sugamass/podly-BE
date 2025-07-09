import { AgentFunction, AgentFunctionInfo } from "graphai";
import { S3Uploader, getS3ConfigFromEnv } from "../../utils/s3Upload";
import fs from "fs";
import path from "path";

const uploadS3Agent: AgentFunction<
  null, // params
  {
    results: Array<{ key: string; url: string }>;
    success: boolean;
    uploadedCount: number;
  }, // output
  {
    directoryPath: string;
    s3Prefix: string;
    waitFor: any;
    cleanup?: boolean;
  } // input
> = async ({ namedInputs }) => {
  const { directoryPath, s3Prefix, cleanup = true } = namedInputs;

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

    // オプション: アップロード後のローカルファイル削除
    if (cleanup) {
      const files = await fs.promises.readdir(directoryPath);
      const localFiles = files.map((file) => path.join(directoryPath, file));
      await s3Uploader.cleanupLocalFiles(localFiles);
    }

    return {
      results: uploadResults,
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
          {
            key: "hls/episode-001/segment_000.ts",
            url: "https://bucket.s3.amazonaws.com/hls/episode-001/segment_000.ts",
          },
        ],
        success: true,
        uploadedCount: 2,
      },
    },
  ],
  description:
    "Upload entire directories to S3 storage with optional local file cleanup",
  category: ["storage", "s3"],
  author: "podly team",
  repository: "https://github.com/podly/podly-BE",
  license: "MIT",
};

export default uploadS3AgentInfo;
