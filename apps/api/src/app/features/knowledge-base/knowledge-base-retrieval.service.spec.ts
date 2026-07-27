import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { EmbeddingService } from '@api/ports/embedding/embedding.service';
import { VectorDatabaseService } from '@api/ports/vector-database/vector-database.service';
import { KnowledgeBaseRetrievalService } from './knowledge-base-retrieval.service';

describe('KnowledgeBaseRetrievalService', () => {
  const generateEmbeddings = jest.fn();
  const getDimensions = jest.fn();
  const search = jest.fn();

  beforeEach(() => {
    generateEmbeddings.mockResolvedValue([[0.1, 0.2, 0.3]]);
    getDimensions.mockReturnValue(3);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('embeds the query and preserves relevant result ordering', async () => {
    search.mockResolvedValue([
      createResult('first', 0.94),
      createResult('second', 0.82),
      createResult('below-threshold', 0.7),
      createResult('beyond-limit', 0.93),
    ]);
    const service = createService();

    await expect(service.retrieve('How long do refunds take?')).resolves.toEqual(
      [
        expect.objectContaining({ id: 'first', score: 0.94 }),
        expect.objectContaining({ id: 'second', score: 0.82 }),
      ],
    );
    expect(generateEmbeddings).toHaveBeenCalledWith([
      'How long do refunds take?',
    ]);
    expect(search).toHaveBeenCalledWith(
      'knowledge-base',
      [0.1, 0.2, 0.3],
      2,
      0.75,
    );
  });

  it('discards malformed vector payloads', async () => {
    search.mockResolvedValue([
      createResult('valid', 0.9),
      createResult('malformed', 0.85, { content: 42 }),
    ]);
    const service = createService();

    await expect(service.retrieve('Return policy')).resolves.toEqual([
      expect.objectContaining({ id: 'valid' }),
    ]);
  });

  it.each([
    ['embedding provider', generateEmbeddings],
    ['vector database', search],
  ])('returns a safe error when the %s fails', async (_name, failingMock) => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    search.mockResolvedValue([]);
    failingMock.mockRejectedValueOnce(new Error('raw provider secret'));
    const service = createService();

    await expect(service.retrieve('Return policy')).rejects.toThrow(
      new ServiceUnavailableException(
        'Knowledge retrieval is temporarily unavailable.',
      ),
    );
    expect(Logger.prototype.error).toHaveBeenCalledWith(
      'Unable to retrieve knowledge-base context',
    );
  });

  it('returns a safe error for a malformed query embedding', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    generateEmbeddings.mockResolvedValue([[0.1]]);
    const service = createService();

    await expect(service.retrieve('Return policy')).rejects.toThrow(
      'Knowledge retrieval is temporarily unavailable.',
    );
    expect(search).not.toHaveBeenCalled();
  });

  function createService(): KnowledgeBaseRetrievalService {
    return new KnowledgeBaseRetrievalService(
      {
        generateEmbeddings,
        getDimensions,
      } as unknown as EmbeddingService,
      { search } as unknown as VectorDatabaseService,
      {
        collectionName: 'knowledge-base',
        retrievalLimit: 2,
        retrievalScoreThreshold: 0.75,
      },
    );
  }
});

function createResult(
  id: string,
  score: number,
  payloadOverrides: Record<string, unknown> = {},
) {
  return {
    id,
    score,
    payload: {
      sourcePath: 'policies/refunds.md',
      category: 'policies',
      documentTitle: 'Refund Policy',
      sectionTitle: 'Timing',
      sectionIndex: 1,
      content: 'Approved refunds are processed within five business days.',
      contentHash: 'content-hash',
      ...payloadOverrides,
    },
  };
}
