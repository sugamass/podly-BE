import { AgentFunction, AgentFunctionInfo } from "graphai";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";

// ===== Types =====
export type HtmlExtractInputs = {
  urls: string[]; // 対象HTMLページのURL
  minLength?: number; // 本文の最小文字数（デフォルト 60）
  prefer?: Array<"jsonld" | "readability" | "selector">; // 抽出優先度（デフォルトの順序を上書き）
};

export type HtmlExtractItem = {
  url: string;
  source: "jsonld" | "readability" | "selector" | "none";
  title?: string;
  bodyText: string; // 改行区切り
  html?: string; // 本文HTML（可能なら）
  byline?: string;
  published?: string; // ISO 8601 など
};

export type HtmlExtractResult = HtmlExtractItem[];

// ===== Agent =====
export const htmlArticleExtractorAgent: AgentFunction<
  HtmlExtractInputs,
  HtmlExtractResult,
  HtmlExtractInputs
> = async ({ namedInputs }) => {
  const {
    urls,
    minLength = 60,
    prefer = ["jsonld", "readability", "selector"],
  } = namedInputs;

  const results: HtmlExtractResult = [];

  for (const url of urls) {
    try {
      const html = await fetchHtml(url);
      const extracted = extractArticleFromHtml(html, url, {
        minLength,
        prefer,
      });

      results.push(extracted);
    } catch (err) {
      console.warn(`Failed to extract article from ${url}:`, err);
      results.push({
        url,
        source: "none",
        bodyText: "",
      });
    }
  }

  return results;
};

// ===== Info =====
export const htmlArticleExtractorAgentInfo: AgentFunctionInfo = {
  name: "htmlArticleExtractorAgent",
  agent: htmlArticleExtractorAgent,
  mock: htmlArticleExtractorAgent,
  description:
    "ニュース記事などのHTMLから本文を抽出し、JSON-LD → Readability → セレクタの順でフォールバックするエージェント",
  category: ["data", "scraping"],
  inputs: {
    type: "object",
    properties: {
      urls: {
        type: "array",
        items: { type: "string" },
        description: "本文を抽出したいHTMLページのURL配列",
      },
      minLength: {
        type: "number",
        description: "本文として採用する最小文字数（デフォルト 60 文字）",
      },
      prefer: {
        type: "array",
        items: { type: "string", enum: ["jsonld", "readability", "selector"] },
        description:
          "抽出手段の優先順序（デフォルト: jsonld → readability → selector）",
      },
    },
    required: ["urls"],
  },
  output: {
    type: "array",
    items: {
      type: "object",
      properties: {
        url: { type: "string" },
        source: { type: "string" },
        title: { type: "string" },
        bodyText: { type: "string" },
        html: { type: "string" },
        byline: { type: "string" },
        published: { type: "string" },
        images: { type: "array", items: { type: "string" } },
      },
    },
  },
  samples: [
    {
      inputs: {
        urls: ["http://www3.nhk.or.jp/news/html/20250811/k10014891101000.html"],
      },
      params: {},
      result: [],
    },
  ],
  author: "Sugamass",
  repository: "",
  license: "",
};

export default htmlArticleExtractorAgentInfo;

// ===== Implementation details =====
async function fetchHtml(url: string): Promise<string> {
  const got = (await import("got")).default;
  const res = await got(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; HtmlArticleExtractor/1.0)",
      "Accept-Language": "ja,en;q=0.8",
    },
    timeout: { request: 10000 },
    http2: true,
  });
  return res.body;
}

function extractArticleFromHtml(
  html: string,
  url: string,
  opts: {
    minLength: number;
    prefer: Array<"jsonld" | "readability" | "selector">;
  }
): HtmlExtractItem {
  const order = opts.prefer;

  for (const method of order) {
    if (method === "jsonld") {
      const item = extractFromJsonLd(html, url, opts.minLength);
      if (item) {
        console.log("HTML extract method: jsonld");
        return item;
      }
    }
    if (method === "readability") {
      // NHK RSS の場合は readability で抽出
      const item = extractWithReadability(html, url, opts.minLength);
      if (item) {
        console.log("HTML extract method: readability");
        return item;
      }
    }
    if (method === "selector") {
      const item = extractWithSelectors(html, url, opts.minLength);
      if (item) {
        console.log("HTML extract method: selector");
        return item;
      }
    }
  }

  return { url, source: "none", bodyText: "" };
}

function extractFromJsonLd(
  html: string,
  url: string,
  minLength: number
): HtmlExtractItem | null {
  try {
    const $ = cheerio.load(html);
    const scripts = $('script[type="application/ld+json"]')
      .map((_, el) => $(el).contents().text())
      .get();

    const blocks: any[] = [];
    for (const raw of scripts) {
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) blocks.push(...data);
        else if (data && typeof data === "object") {
          if (Array.isArray((data as any)["@graph"]))
            blocks.push(...(data as any)["@graph"]);
          blocks.push(data);
        }
      } catch {
        // ignore parse errors
      }
    }

    for (const node of blocks) {
      const t = node?.["@type"];
      if (t === "NewsArticle" || t === "Article" || t === "BlogPosting") {
        const body = (node.articleBody || "").toString().trim();
        if (body && body.length >= minLength) {
          const title = node.headline || node.name;
          const published = node.datePublished || node.dateModified;
          const byline =
            (Array.isArray(node.author)
              ? node.author
                  .map((a: any) => a?.name)
                  .filter(Boolean)
                  .join(", ")
              : node.author?.name) ||
            node.creator ||
            undefined;
          const images: string[] = [];
          if (typeof node.image === "string") images.push(node.image);
          else if (Array.isArray(node.image))
            images.push(...node.image.filter(Boolean));
          else if (node.image?.url) images.push(node.image.url);

          return {
            url,
            source: "jsonld",
            title,
            bodyText: normalize(body),
            byline,
            published,
          };
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function extractWithReadability(
  html: string,
  url: string,
  minLength: number
): HtmlExtractItem | null {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const art = reader.parse();
    const text = art?.textContent?.trim() ?? "";
    if (text.length >= minLength) {
      const images = extractImagesFromHtml(art?.content || "");
      return {
        url,
        source: "readability",
        title: art?.title ?? undefined,
        bodyText: normalize(text),
        html: art?.content ?? undefined,
        byline: art?.byline ?? undefined,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function extractWithSelectors(
  html: string,
  url: string,
  minLength: number
): HtmlExtractItem | null {
  try {
    const $ = cheerio.load(html);

    // NHK を含むニュース系の「ありがちな」候補を上から試す
    const selectors = [
      "main article",
      "article",
      "#news_textbody, #news_textmore",
      '[class*="detail"] [class*="body"]',
      '[class*="article"] [class*="body"]',
      'main [class*="article"]',
      'main [role="main"]',
    ];

    for (const sel of selectors) {
      const node = $(sel).first();
      if (!node || node.length === 0) continue;

      // 画像URLも拾う
      const imgs = node
        .find("img")
        .map((_, el) => $(el).attr("src") || $(el).attr("data-src"))
        .get()
        .filter((s) => typeof s === "string" && !!s)
        .map((s) => absolutize(url, s as string));

      const paragraphs = node
        .find("p")
        .map((_, el) => $(el).text())
        .get();
      const text = normalize(paragraphs.join("\n"));
      if (text.length >= minLength) {
        const title =
          $("h1").first().text().trim() ||
          $('meta[property="og:title"]').attr("content") ||
          undefined;
        const published =
          $('meta[property="article:published_time"]').attr("content") ||
          $("time[datetime]").attr("datetime") ||
          undefined;

        return {
          url,
          source: "selector",
          title,
          bodyText: text,
          html: node.html() ?? undefined,
          published,
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function normalize(s: string): string {
  return s
    .replace(/\r\n|\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function absolutize(baseUrl: string, maybeRelative: string): string {
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return maybeRelative;
  }
}

function extractImagesFromHtml(html: string): string[] {
  try {
    const $ = cheerio.load(html);
    return $("img")
      .map((_, el) => $(el).attr("src") || $(el).attr("data-src"))
      .get()
      .filter((s) => typeof s === "string" && !!s) as string[];
  } catch {
    return [];
  }
}
