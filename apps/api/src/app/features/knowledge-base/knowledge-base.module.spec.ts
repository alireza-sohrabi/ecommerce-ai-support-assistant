import { Test } from '@nestjs/testing';
import { QdrantService } from '@api/integrations/qdrant';
import { OpenAIEmbeddingService } from '@api/integrations/openai';
import { OPENAI_CLIENT } from '@api/integrations/openai/openai-client.constant';
import { IntegrationsModule } from '@api/integrations/integrations.module';
import { KnowledgeBaseRetrievalService } from './knowledge-base-retrieval.service';
import { KNOWLEDGE_BASE_SETTINGS } from './knowledge-base-settings';
import { KnowledgeBaseSyncService } from './knowledge-base-sync.service';
import { KnowledgeBaseModule } from './knowledge-base.module';

describe('KnowledgeBaseModule', () => {
  it('exposes knowledge-base retrieval and synchronization', async () => {
    const qdrantService = {
      listCollections: jest.fn(),
    };
    const openAIEmbeddingService = {
      getDimensions: jest.fn(),
      generateEmbeddings: jest.fn(),
    };
    const retrievalService = {
      retrieve: jest.fn(),
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
      .overrideProvider(KNOWLEDGE_BASE_SETTINGS)
      .useValue({
        collectionName: 'knowledge-base',
        retrievalLimit: 4,
        retrievalScoreThreshold: 0.7,
      })
      .overrideProvider(KnowledgeBaseRetrievalService)
      .useValue(retrievalService)
      .compile();

    expect(module.get(KnowledgeBaseSyncService)).toBeInstanceOf(
      KnowledgeBaseSyncService,
    );
    expect(module.get(KnowledgeBaseRetrievalService)).toBe(retrievalService);
  });
});
