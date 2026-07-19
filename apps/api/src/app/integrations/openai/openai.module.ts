import { Module } from '@nestjs/common';
import { openAIClientProvider } from './openai-client.provider';

@Module({
  providers: [openAIClientProvider],
  exports: [openAIClientProvider],
})
export class OpenAIModule {}
