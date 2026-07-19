import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { OPENAI_CLIENT } from '@api/integrations/openai';
import { ConfigService } from '@nestjs/config';
import { APIError } from 'openai';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
    private readonly configService: ConfigService,
  ) {}

  async processMessage(message: string): Promise<string> {
    const model = this.configService.getOrThrow<string>('OPENAI_MODEL');

    try {
      const response = await this.openai.responses.create({
        model,
        input: message,
        instructions:
          'You are a concise and helpful ecommerce customer support assistant.',
        max_output_tokens: 300,
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
