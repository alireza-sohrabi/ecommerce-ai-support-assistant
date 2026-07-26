import { Test } from '@nestjs/testing';
import { QdrantService } from '@api/integrations/qdrant';
import { OpenAIEmbeddingService } from '@api/integrations/openai';
import { OPENAI_CLIENT } from '@api/integrations/openai/openai-client.constant';
import { IntegrationsModule } from '@api/integrations/integrations.module';
import { KnowledgeBaseIngestionService } from './knowledge-base-ingestion.service';
import { KnowledgeBaseSyncService } from './knowledge-base-sync.service';
import { KnowledgeBaseModule } from './knowledge-base.module';

describe('KnowledgeBaseModule', () => {
  it('exposes knowledge-base ingestion and synchronization', async () => {
    const qdrantService = {
      listCollections: jest.fn(),
    };
    const openAIEmbeddingService = {
      getDimensions: jest.fn(),
      generateEmbeddings: jest.fn(),
    };
    const module = await Test.createTestingModule({
      imports: [IntegrationsModule, KnowledgeBaseModule],
    })
      .overrideProvider(OPENAI_CLIENT)
      .useValue({})
      .overrideProvider(OpenAIEmbeddingService)
      .useValue(openAIEmbeddingService)
      .overrideProvider(QdrantService)
      .useValue(qdrantService)
      .compile();

    expect(module.get(KnowledgeBaseIngestionService)).toBeInstanceOf(
      KnowledgeBaseIngestionService,
    );
    expect(module.get(KnowledgeBaseSyncService)).toBeInstanceOf(
      KnowledgeBaseSyncService,
    );
  });
});
