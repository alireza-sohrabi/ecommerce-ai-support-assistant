import { Module } from '@nestjs/common';
import { openAIClientProvider } from './openai-client.provider';
import { OpenAIService } from './openai.service';

@Module({
  providers: [openAIClientProvider, OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
