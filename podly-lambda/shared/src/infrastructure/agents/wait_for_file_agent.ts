import { AgentFunction, AgentFunctionInfo } from "graphai";
import * as fs from "fs";
import * as path from "path";

const waitForFileAgent: AgentFunction = async ({ params, namedInputs }) => {
  const { outputDir, timeout = 5000 } = params;

  const { fileName } = namedInputs;
  const filePath = path.join(outputDir, fileName);

  return new Promise<boolean>((resolve, reject) => {
    // まず、すでにファイルが存在するかを確認
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (!err) {
        return resolve(true);
      }

      // ファイルが存在しない場合、ディレクトリの変更を監視
      const watcher = fs.watch(
        outputDir,
        (_eventType: string, filename: string | Buffer | null) => {
          if (filename) {
            // filename が Buffer の場合も考慮する
            const fileNameFromEvent =
              typeof filename === "string" ? filename : filename.toString();
            if (fileNameFromEvent === fileName) {
              // ファイルの存在を再確認
              fs.access(filePath, fs.constants.F_OK, (err) => {
                if (!err) {
                  watcher.close();
                  clearTimeout(timeoutTimer);
                  resolve(true);
                }
              });
            }
          }
        }
      );

      // タイムアウトの設定（一定時間内にファイルが作成されなければ false を返す）
      const timeoutTimer = setTimeout(() => {
        watcher.close();
        resolve(false);
      }, timeout);
    });
  });
};

const sampleInput = {
  fileName: "sample.m3u8",
  timeout: 5000,
};

const sampleParams = {
  outputDir: "src/graphaiTools/agent/test/output",
};

const sampleResult = true;

const waitForFileAgentInfo: AgentFunctionInfo = {
  name: "waitForFileAgent",
  agent: waitForFileAgent,
  mock: waitForFileAgent,
  samples: [
    {
      inputs: sampleInput,
      params: sampleParams,
      result: sampleResult,
    },
  ],
  description:
    "指定されたディレクトリ内でファイルが作成されるまで監視し、作成が確認できたら true を返すエージェントです。",
  category: ["filesystem"],
  author: "Your Name",
  repository: "",
  license: "",
};

export default waitForFileAgentInfo;
