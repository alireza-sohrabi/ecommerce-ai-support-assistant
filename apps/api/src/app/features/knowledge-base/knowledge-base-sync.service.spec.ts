import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from '@api/ports/embedding/embedding.service';
import { VectorDatabaseService } from '@api/ports/vector-database/vector-database.service';
import type { KnowledgeChunk } from './knowledge-chunk';
import { KnowledgeBaseIngestionService } from './knowledge-base-ingestion.service';
import { KnowledgeBaseSyncService } from './knowledge-base-sync.service';

describe('KnowledgeBaseSyncService', () => {
  const unchangedChunk = createChunk({
    id: '11111111-1111-5111-8111-111111111111',
    sectionTitle: 'Overview',
    sectionIndex: 0,
    content: 'Unchanged content.',
    contentHash: 'unchanged-hash',
  });
  const changedChunk = createChunk({
    id: '22222222-2222-5222-8222-222222222222',
    sectionTitle: 'Timing',
    sectionIndex: 1,
    content: 'Changed content.',
    contentHash: 'changed-hash',
  });

  const prepareChunks = jest.fn();
  const getDimensions = jest.fn();
  const generateEmbeddings = jest.fn();
  const ensureCollection = jest.fn();
  const listPoints = jest.fn();
  const upsertPoints = jest.fn();
  const deletePoints = jest.fn();

  beforeEach(() => {
    prepareChunks.mockResolvedValue([unchangedChunk, changedChunk]);
    getDimensions.mockReturnValue(3);
    generateEmbeddings.mockResolvedValue([[0.1, 0.2, 0.3]]);
    listPoints.mockResolvedValue([
      {
        id: unchangedChunk.id,
        contentHash: unchangedChunk.contentHash,
      },
      {
        id: changedChunk.id,
        contentHash: 'old-hash',
      },
      {
        id: '33333333-3333-5333-8333-333333333333',
        contentHash: 'stale-hash',
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('embeds changed chunks, upserts metadata, and deletes stale points', async () => {
    const service = createService();

    await expect(service.synchronize()).resolves.toEqual({
      total: 2,
      unchanged: 1,
      embedded: 1,
      upserted: 1,
      deleted: 1,
    });
    expect(ensureCollection).toHaveBeenCalledWith('knowledge-base', 3);
    expect(listPoints).toHaveBeenCalledWith('knowledge-base');
    expect(generateEmbeddings).toHaveBeenCalledWith([
      [
        `# ${changedChunk.documentTitle}`,
        `## ${changedChunk.sectionTitle}`,
        changedChunk.content,
      ].join('\n\n'),
    ]);
    expect(upsertPoints).toHaveBeenCalledWith('knowledge-base', [
      {
        id: changedChunk.id,
        vector: [0.1, 0.2, 0.3],
        payload: {
          sourcePath: changedChunk.sourcePath,
          category: changedChunk.category,
          documentTitle: changedChunk.documentTitle,
          sectionTitle: changedChunk.sectionTitle,
          sectionIndex: changedChunk.sectionIndex,
          content: changedChunk.content,
          contentHash: changedChunk.contentHash,
        },
      },
    ]);
    expect(deletePoints).toHaveBeenCalledWith('knowledge-base', [
      '33333333-3333-5333-8333-333333333333',
    ]);
  });

  it('performs no embedding or vector writes when all chunks are unchanged', async () => {
    listPoints.mockResolvedValue([
      {
        id: unchangedChunk.id,
        contentHash: unchangedChunk.contentHash,
      },
      {
        id: changedChunk.id,
        contentHash: changedChunk.contentHash,
      },
    ]);
    const service = createService();

    await expect(service.synchronize()).resolves.toEqual({
      total: 2,
      unchanged: 2,
      embedded: 0,
      upserted: 0,
      deleted: 0,
    });
    expect(generateEmbeddings).not.toHaveBeenCalled();
    expect(upsertPoints).toHaveBeenCalledWith('knowledge-base', []);
    expect(deletePoints).toHaveBeenCalledWith('knowledge-base', []);
  });

  it('rejects embeddings with an unexpected vector size before writing', async () => {
    generateEmbeddings.mockResolvedValue([[0.1, 0.2]]);
    const service = createService();

    await expect(service.synchronize()).rejects.toThrow(
      `Embedding for chunk "${changedChunk.id}" has an unexpected size`,
    );
    expect(upsertPoints).not.toHaveBeenCalled();
    expect(deletePoints).not.toHaveBeenCalled();
  });

  function createService(): KnowledgeBaseSyncService {
    const ingestion = {
      prepareChunks,
    } as unknown as KnowledgeBaseIngestionService;
    const embeddingService = {
      getDimensions,
      generateEmbeddings,
    } as unknown as EmbeddingService;
    const vectorDatabase = {
      ensureCollection,
      listPoints,
      upsertPoints,
      deletePoints,
    } as unknown as VectorDatabaseService;
    const configuration: Record<string, string> = {
      KNOWLEDGE_BASE_VECTOR_COLLECTION: 'knowledge-base',
    };
    const configService = {
      getOrThrow: jest.fn((key: string) => configuration[key]),
    } as unknown as ConfigService;

    return new KnowledgeBaseSyncService(
      ingestion,
      embeddingService,
      vectorDatabase,
      configService,
    );
  }
});

function createChunk(overrides: Partial<KnowledgeChunk>): KnowledgeChunk {
  return {
    id: '00000000-0000-5000-8000-000000000000',
    sourcePath: 'policies/refunds.md',
    category: 'policies',
    documentTitle: 'Refund Policy',
    sectionTitle: 'Overview',
    sectionIndex: 0,
    content: 'Content.',
    contentHash: 'content-hash',
    ...overrides,
  };
}
