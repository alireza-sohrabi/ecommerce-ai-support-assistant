export interface AiApiMessage {
  content: string;
  role: 'assistant' | 'user';
}

export interface GenerateAiResponseRequest {
  input: string | AiApiMessage[];
  instructions?: string;
  maxOutputTokens?: number;
}

export abstract class AiApiService {
  abstract generateResponse(
    request: GenerateAiResponseRequest,
  ): Promise<string>;
}
