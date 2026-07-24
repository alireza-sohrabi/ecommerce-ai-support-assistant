import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { APIError } from 'openai';
import type {
  AiApiService,
  GenerateAiResponseRequest,
} from '../../ai-api/ai-api.service';
import { OPENAI_CLIENT } from './openai-client.constant';

@Injectable()
export class OpenAIService implements AiApiService {
  private readonly logger = new Logger(OpenAIService.name);

  constructor(
    @Inject(OPENAI_CLIENT) private readonly client: OpenAI,
    private readonly configService: ConfigService,
  ) {}

  async generateResponse(
    request: GenerateAiResponseRequest,
  ): Promise<string> {
    const model = this.configService.getOrThrow<string>('OPENAI_MODEL');

    try {
      const response = await this.client.responses.create({
        model,
        input: request.input,
        instructions: request.instructions,
        max_output_tokens: request.maxOutputTokens,
      });

      return response.output_text;
    } catch (error) {
      if (error instanceof APIError) {
        this.logger.error(
          'OpenAI API Error:',
          error.status,
          error.code,
          error.requestID,
        );
      } else {
        this.logger.error('Unexpected error:', error);
      }

      throw new ServiceUnavailableException(
        'AI service is temporarily unavailable. Please try again later.',
      );
    }
  }
}
