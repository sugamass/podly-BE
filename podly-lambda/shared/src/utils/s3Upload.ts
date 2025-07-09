import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

export interface S3UploadConfig {
  bucketName: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface S3UploadResult {
  key: string;
  url: string;
}

export class S3Uploader {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(config: S3UploadConfig) {
    this.bucketName = config.bucketName;

    this.s3Client = new S3Client({
      region: config.region,
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined, // IAMロールを使用する場合は undefined
    });
  }

  /**
   * 単一ファイルをS3にアップロード
   */
  async uploadFile(
    filePath: string,
    s3Key: string,
    contentType?: string
  ): Promise<S3UploadResult> {
    try {
      const fileBuffer = await fs.promises.readFile(filePath);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: contentType || this.getContentType(filePath),
      });

      await this.s3Client.send(command);

      const url = `https://${this.bucketName}.s3.amazonaws.com/${s3Key}`;

      return {
        key: s3Key,
        url: url,
      };
    } catch (error) {
      console.error(`Failed to upload file ${filePath} to S3:`, error);
      throw error;
    }
  }

  /**
   * ディレクトリ内の全ファイルをS3にアップロード
   */
  async uploadDirectory(
    localDir: string,
    s3Prefix: string
  ): Promise<S3UploadResult[]> {
    try {
      const files = await fs.promises.readdir(localDir);
      const uploadPromises = files.map(async (file) => {
        const filePath = path.join(localDir, file);
        const s3Key = `${s3Prefix}/${file}`;
        return this.uploadFile(filePath, s3Key);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error(`Failed to upload directory ${localDir} to S3:`, error);
      throw error;
    }
  }

  /**
   * HLS関連ファイル（.m3u8と.tsファイル）をS3にアップロード
   */
  async uploadHlsFiles(
    outputDir: string,
    baseName: string,
    s3Prefix: string
  ): Promise<{
    playlistUrl: string;
    segmentUrls: string[];
  }> {
    try {
      const files = await fs.promises.readdir(outputDir);
      const hlsFiles = files.filter(
        (file) =>
          file.startsWith(baseName) &&
          (file.endsWith(".m3u8") || file.endsWith(".ts"))
      );

      const uploadResults: S3UploadResult[] = [];

      for (const file of hlsFiles) {
        const filePath = path.join(outputDir, file);
        const s3Key = `${s3Prefix}/${file}`;
        const result = await this.uploadFile(filePath, s3Key);
        uploadResults.push(result);
      }

      const playlistResult = uploadResults.find((r) => r.key.endsWith(".m3u8"));
      const segmentResults = uploadResults.filter((r) => r.key.endsWith(".ts"));

      if (!playlistResult) {
        throw new Error("Playlist file (.m3u8) not found in upload results");
      }

      return {
        playlistUrl: playlistResult.url,
        segmentUrls: segmentResults.map((r) => r.url),
      };
    } catch (error) {
      console.error(`Failed to upload HLS files to S3:`, error);
      throw error;
    }
  }

  /**
   * ローカルファイルの削除
   */
  async cleanupLocalFiles(filePaths: string[]): Promise<void> {
    const deletePromises = filePaths.map(async (filePath) => {
      try {
        await fs.promises.unlink(filePath);
        console.log(`Deleted local file: ${filePath}`);
      } catch (error) {
        console.error(`Failed to delete local file ${filePath}:`, error);
      }
    });

    await Promise.all(deletePromises);
  }

  /**
   * ファイル拡張子からContent-Typeを取得
   */
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case ".m3u8":
        return "application/x-mpegURL";
      case ".ts":
        return "video/mp2t";
      case ".mp3":
        return "audio/mpeg";
      default:
        return "application/octet-stream";
    }
  }

  /**
   * S3からファイルをダウンロード
   */
  async downloadFile(s3Key: string, localFilePath: string): Promise<void> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error("No body in S3 response");
      }

      // ディレクトリが存在しない場合は作成
      await fs.promises.mkdir(path.dirname(localFilePath), { recursive: true });

      // Stream to file
      const chunks: Buffer[] = [];
      const stream = response.Body as NodeJS.ReadableStream;

      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);
      await fs.promises.writeFile(localFilePath, buffer);

      console.log(`Downloaded ${s3Key} to ${localFilePath}`);
    } catch (error) {
      console.error(`Failed to download ${s3Key} from S3:`, error);
      throw error;
    }
  }

  /**
   * musicファイルをS3からダウンロード
   */
  async downloadMusicFile(
    musicFileName: string,
    localDir: string
  ): Promise<string> {
    const localFilePath = path.join(localDir, musicFileName);

    // ファイルが既に存在する場合はダウンロードをスキップ
    try {
      await fs.promises.access(localFilePath);
      console.log(`Music file already exists: ${localFilePath}`);
      return localFilePath;
    } catch {
      // ファイルが存在しない場合はダウンロード
    }

    const s3Key = `music/${musicFileName}`;
    await this.downloadFile(s3Key, localFilePath);
    return localFilePath;
  }
}

/**
 * 環境変数からS3設定を取得
 */
export function getS3ConfigFromEnv(): S3UploadConfig {
  const bucketName = process.env.S3_BUCKET_NAME;
  const region =
    process.env.S3_REGION || process.env.AWS_DEFAULT_REGION || "ap-northeast-1";

  if (!bucketName) {
    throw new Error("S3_BUCKET_NAME environment variable is required");
  }

  return {
    bucketName,
    region,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}
