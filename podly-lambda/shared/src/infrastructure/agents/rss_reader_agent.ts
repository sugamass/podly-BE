import Parser from "rss-parser";
import { AgentFunction, AgentFunctionInfo } from "graphai";

type RSSInputs = {
  feedUrls: string[]; // RSSフィードURLの配列
  keywords?: string[]; // 任意の検索キーワード（例: ["日本", "経済"]）
  maxItems?: number; // 取得する最大件数（デフォルト5件）
};

type RSSResult = {
  title: string;
  link: string;
  pubDate?: string;
  contentSnippet?: string;
}[];

export const rssReaderAgent: AgentFunction<
  RSSInputs,
  RSSResult,
  RSSInputs
> = async ({ namedInputs }) => {
  const parser = new Parser();
  const { feedUrls, keywords = [], maxItems = 5 } = namedInputs;

  const allItems: RSSResult = [];

  for (const url of feedUrls) {
    try {
      const feed = await parser.parseURL(url);
      const filteredItems = feed.items
        .filter((item) => {
          if (!keywords.length) return true;
          const targetText = `${item.title} ${item.contentSnippet ?? ""}`;
          return keywords.some((kw) => targetText.includes(kw));
        })
        .slice(0, maxItems)
        .map((item) => ({
          title: item.title ?? "",
          link: item.link ?? "",
          pubDate: item.pubDate,
        }));

      allItems.push(...filteredItems);
    } catch (err) {
      console.warn(`Failed to fetch RSS feed from ${url}:`, err);
    }
  }

  return allItems;
};

export const rssReaderAgentInfo: AgentFunctionInfo = {
  name: "rssReaderAgent",
  agent: rssReaderAgent,
  mock: rssReaderAgent,
  description:
    "RSS フィードを横断的に取得し、キーワードでフィルタリングして最新順に返すエージェント",
  category: ["data"],
  inputs: {
    type: "object",
    properties: {
      feedUrls: {
        type: "array",
        items: { type: "string" },
        description: "RSS フィード URL の配列",
      },
      keywords: {
        type: "array",
        items: { type: "string" },
        description: "記事タイトル・本文に含めたいキーワード (任意)",
      },
      maxItems: {
        type: "number",
        description: "返却する最大記事数 (デフォルト 10 件)",
      },
    },
    required: ["feedUrls"],
  },
  output: {
    type: "array",
    items: {
      type: "object",
      properties: {
        title: { type: "string" },
        link: { type: "string" },
        pubDate: { type: "string" },
        contentSnippet: { type: "string" },
      },
    },
  },
  samples: [
    {
      inputs: {
        feedUrls: ["https://www3.nhk.or.jp/rss/news/cat0.xml"],
        keywords: ["日本", "経済"],
        maxItems: 5,
      },
      params: {},
      result: [],
    },
  ],
  author: "Kazumasa Sugawara",
  repository: "",
  license: "",
};

export default rssReaderAgentInfo;
