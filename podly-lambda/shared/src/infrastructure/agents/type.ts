export type ScriptData = {
  speaker: string;
  text: string;
  caption: string | undefined;
  duration: number; // generated
  filename: string; // generated
  imagePrompt: string; // inserted by LLM
};

export type PodcastScript = {
  id: string;
  title: string;
  padding: number | undefined;
  description: string;
  reference: string[]; //  配列にする
  tts: string | undefined; // default: openAI
  voices: string[] | undefined;
  speakers: string[] | undefined;
  script: ScriptData[];
  filename: string; // generated
  voicemap: Map<string, string>; // generated
  ttsAgent: string; // generated
  imageInfo: any[]; // generated
  aspectRatio: string | undefined; // "16:9" or "9:16"
};

export type PodcastAudioForSave = {
  id: string;
  title: string;
  padding: number;
  description: string;
  script: ScriptData[];
  created_by: string;
  created_at: Date;
  reference: string[];
  tts: string;
  voices: string[];
  speakers: string[];
};
