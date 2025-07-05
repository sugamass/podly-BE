// ドメイン固有の型定義（API schemaから独立）
export interface ScriptData {
  speaker?: string;
  text?: string;
  caption?: string;
}

export interface PromptScriptData {
  prompt: string;
  script?: ScriptData[];
  reference?: Reference[];
  situation?: string;
}

// UseCaseの入力・出力型（ドメイン固有）
export interface CreateScriptUseCaseInput {
  prompt: string;
  previousScript?: PromptScriptData[];
  reference?: string[];
  isSearch?: boolean;
  wordCount?: number;
  situation?: Situation;
  speakers?: string[];
}

export interface CreateScriptUseCaseOutput {
  newScript: PromptScriptData;
  previousScript?: PromptScriptData[];
}

export type Situation =
  | "school"
  | "expert"
  | "interview"
  | "friends"
  | "radio_personality";

export type Reference = {
  url: string;
  title?: string;
  startIndex?: number;
  endIndex?: number;
};
