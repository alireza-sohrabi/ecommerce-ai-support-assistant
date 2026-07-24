import { Test } from '@nestjs/testing';
import { QdrantService } from '@api/integrations/qdrant';
import { KnowledgeBaseModule } from './knowledge-base.module';
import { VectorDatabaseService } from './vector-database.service';

describe('KnowledgeBaseModule', () => {
  it('exposes Qdrant through the vector database abstraction', async () => {
    const qdrantService = {
      listCollections: jest.fn(),
    };
    const module = await Test.createTestingModule({
      imports: [KnowledgeBaseModule],
    })
      .overrideProvider(QdrantService)
      .useValue(qdrantService)
      .compile();

    expect(module.get(VectorDatabaseService)).toBe(qdrantService);
  });
});
