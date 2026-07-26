import { Test } from '@nestjs/testing';
import {
  OpenAIEmbeddingService,
  OpenAIService,
} from '@api/integrations/openai';
import { OPENAI_CLIENT } from '@api/integrations/openai/openai-client.constant';
import { QdrantService } from '@api/integrations/qdrant';
import { AiApiService } from '@api/ports/ai-api/ai-api.service';
import { EmbeddingService } from '@api/ports/embedding/embedding.service';
import { VectorDatabaseService } from '@api/ports/vector-database/vector-database.service';
import { IntegrationsModule } from './integrations.module';

describe('IntegrationsModule', () => {
  it('binds provider-neutral ports to configured integrations', async () => {
    const openAIService = {
      generateResponse: jest.fn(),
    };
    const openAIEmbeddingService = {
      generateEmbeddings: jest.fn(),
      getDimensions: jest.fn(),
    };
    const qdrantService = {
      deletePoints: jest.fn(),
      ensureCollection: jest.fn(),
      listCollections: jest.fn(),
      listPoints: jest.fn(),
      upsertPoints: jest.fn(),
    };
    const module = await Test.createTestingModule({
      imports: [IntegrationsModule],
    })
      .overrideProvider(OPENAI_CLIENT)
      .useValue({})
      .overrideProvider(OpenAIService)
      .useValue(openAIService)
      .overrideProvider(OpenAIEmbeddingService)
      .useValue(openAIEmbeddingService)
      .overrideProvider(QdrantService)
      .useValue(qdrantService)
      .compile();

    expect(module.get(AiApiService)).toBe(openAIService);
    expect(module.get(EmbeddingService)).toBe(openAIEmbeddingService);
    expect(module.get(VectorDatabaseService)).toBe(qdrantService);
  });
});
