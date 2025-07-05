import {
  CreateScriptUseCaseInput,
  CreateScriptUseCaseOutput,
  PromptScriptData as DomainPromptScriptData,
  Reference,
} from "../../domain/script/entities/ScriptEntity";
import {
  PostCreateScriptRequest,
  PostCreateScriptResponse,
  PromptScriptData as ApiPromptScriptData,
} from "../../types";

// API型からドメイン型への変換関数
export function convertApiRequestToDomainInput(
  apiRequest: PostCreateScriptRequest
): CreateScriptUseCaseInput {
  // previousScriptをAPI型からドメイン型に変換
  const convertedPreviousScript = apiRequest.previousScript?.map(
    (apiScript: ApiPromptScriptData): DomainPromptScriptData => ({
      prompt: apiScript.prompt,
      script: apiScript.script,
      reference: apiScript.reference?.map(
        (url: string): Reference => ({ url })
      ),
      situation: apiScript.situation,
    })
  );

  return {
    prompt: apiRequest.prompt,
    previousScript: convertedPreviousScript,
    reference: apiRequest.reference,
    isSearch: apiRequest.isSearch,
    wordCount: apiRequest.wordCount,
    situation: apiRequest.situation,
    speakers: undefined, // API schemaにはspeakersがないので、必要に応じて後で追加
  };
}

// ドメイン型からAPI型への変換関数
export function convertDomainOutputToApiResponse(
  domainOutput: CreateScriptUseCaseOutput
): PostCreateScriptResponse {
  // newScriptをドメイン型からAPI型に変換
  const convertedNewScript: ApiPromptScriptData = {
    prompt: domainOutput.newScript.prompt,
    script: domainOutput.newScript.script,
    reference: domainOutput.newScript.reference?.map(
      (ref: Reference) => ref.url
    ),
    situation: domainOutput.newScript.situation,
  };

  // previousScriptをドメイン型からAPI型に変換
  const convertedPreviousScript = domainOutput.previousScript?.map(
    (domainScript: DomainPromptScriptData): ApiPromptScriptData => ({
      prompt: domainScript.prompt,
      script: domainScript.script,
      reference: domainScript.reference?.map((ref: Reference) => ref.url),
      situation: domainScript.situation,
    })
  );

  return {
    newScript: convertedNewScript,
    previousScript: convertedPreviousScript,
  };
}
