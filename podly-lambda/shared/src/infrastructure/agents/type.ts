import { AudioScriptData } from "../../domain/audio/entities/AudioEntity";

export type ScriptData = {
  speaker: string;
  text: string;
  caption: string | undefined;
  duration: number; // generated
  filename: string; // generated
  imagePrompt: string; // inserted by LLM
};

export interface PodcastScript {
  id: string;
  tts: string;
  voices: string[];
  speakers: string[];
  script: AudioScriptData[];
  filename: string;
  voicemap: any;
  ttsAgent: string;
  padding?: any;
  imageInfo: any[];
}
