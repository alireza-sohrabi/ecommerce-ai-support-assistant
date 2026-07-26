import { Global, Module } from '@nestjs/common';
import { AiApiService } from '@api/ports/ai-api/ai-api.service';
import { EmbeddingService } from '@api/ports/embedding/embedding.service';
import { VectorDatabaseService } from '@api/ports/vector-database/vector-database.service';
import { OpenAIEmbeddingService, OpenAIModule, OpenAIService } from './openai';
import { QdrantModule, QdrantService } from './qdrant';

@Global()
@Module({
  imports: [OpenAIModule, QdrantModule],
  providers: [
    {
      provide: AiApiService,
      useExisting: OpenAIService,
    },
    {
      provide: EmbeddingService,
      useExisting: OpenAIEmbeddingService,
    },
    {
      provide: VectorDatabaseService,
      useExisting: QdrantService,
    },
  ],
  exports: [AiApiService, EmbeddingService, VectorDatabaseService],
})
export class IntegrationsModule {}
