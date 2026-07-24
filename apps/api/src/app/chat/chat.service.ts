import { Injectable } from '@nestjs/common';
import { AiApiService } from '../ai-api/ai-api.service';
import { ChatMessage } from './interface/ChatMessage';

@Injectable()
export class ChatService {
  constructor(private readonly aiApiService: AiApiService) {}

  async processMessage(messages: ChatMessage[]): Promise<string> {
    return this.aiApiService.generateResponse({
      input: messages,
      instructions:
        'You are a concise and helpful ecommerce customer support assistant.',
      maxOutputTokens: 300,
    });
  }
}
