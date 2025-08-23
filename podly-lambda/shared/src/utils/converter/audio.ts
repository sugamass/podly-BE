import {
  AudioPreviewUseCaseInput,
  AudioPreviewUseCaseOutput,
  AudioScriptData,
} from "../../domain/audio/entities/AudioEntity";

// API型定義（型は実際のAPI仕様に合わせて調整）
interface ScriptData {
  speaker: string;
  text: string;
  caption: string;
}

interface AudioPreviewRequest {
  script: ScriptData[];
  tts: string;
  voices: string[];
  speakers: string[];
  scriptId?: string;
  bgmId?: string;
  model?: string;
}

interface AudioPreviewResponse {
  audioUrl?: string;
  separatedAudioUrls?: string[];
  scriptId?: string;
  duration?: number;
}

// AudioPreview: API型からドメイン型への変換関数
export function convertAudioPreviewApiRequestToDomainInput(
  apiRequest: AudioPreviewRequest
): AudioPreviewUseCaseInput {
  return {
    script: convertApiScriptDataToDomainScriptData(apiRequest.script),
    tts: apiRequest.tts,
    voices: apiRequest.voices,
    speakers: apiRequest.speakers,
    scriptId: apiRequest.scriptId ?? "",
    bgmId: apiRequest.bgmId,
    model: apiRequest.model ?? "tts-1",
  };
}

// AudioPreview: ドメイン型からAPI型への変換関数
export function convertAudioPreviewDomainOutputToApiResponse(
  domainOutput: AudioPreviewUseCaseOutput
): AudioPreviewResponse {
  return {
    audioUrl: domainOutput.audioUrl,
    separatedAudioUrls: domainOutput.separatedAudioUrls,
    scriptId: domainOutput.scriptId,
    duration: domainOutput.duration,
  };
}

// ヘルパー関数: API ScriptData[] から ドメイン AudioScriptData[] への変換
function convertApiScriptDataToDomainScriptData(
  apiScriptData: ScriptData[]
): AudioScriptData[] {
  return apiScriptData.map((item) => ({
    speaker: item.speaker,
    text: item.text,
    caption: item.caption,
  }));
}
