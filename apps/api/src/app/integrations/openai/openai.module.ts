import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { openAIClientProvider } from './openai-client.provider';
import { OpenAIEmbeddingService } from './openai-embedding.service';
import { OpenAIService } from './openai.service';

@Module({
  imports: [ConfigModule],
  providers: [openAIClientProvider, OpenAIEmbeddingService, OpenAIService],
  exports: [OpenAIEmbeddingService, OpenAIService],
})
export class OpenAIModule {}
