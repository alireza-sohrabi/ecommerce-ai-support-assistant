import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantService } from './qdrant.service';

jest.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: jest.fn(),
}));

describe('QdrantService', () => {
  const getCollectionsMock = jest.fn();
  const createCollectionMock = jest.fn();
  const scrollMock = jest.fn();
  const upsertMock = jest.fn();
  const deleteMock = jest.fn();
  const qdrantClientMock = QdrantClient as jest.MockedClass<
    typeof QdrantClient
  >;

  beforeEach(() => {
    qdrantClientMock.mockImplementation(
      () =>
        ({
          createCollection: createCollectionMock,
          delete: deleteMock,
          getCollections: getCollectionsMock,
          scroll: scrollMock,
          upsert: upsertMock,
        }) as unknown as QdrantClient,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('configures the REST client without exposing configuration values', () => {
    createService({
      QDRANT_API_KEY: 'test-api-key',
      QDRANT_ENDPOINT: 'https://qdrant.example.test/',
    });

    expect(qdrantClientMock).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      url: 'https://qdrant.example.test',
    });
  });

  it.each([
    [{ QDRANT_API_KEY: '', QDRANT_ENDPOINT: 'http://localhost:6333' }],
    [{ QDRANT_API_KEY: 'test-api-key', QDRANT_ENDPOINT: '' }],
    [{ QDRANT_API_KEY: 'test-api-key', QDRANT_ENDPOINT: 'not-a-url' }],
    [{ QDRANT_API_KEY: 'test-api-key', QDRANT_ENDPOINT: 'ftp://localhost' }],
    [
      {
        QDRANT_API_KEY: 'test-api-key',
        QDRANT_ENDPOINT: 'https://user:password@qdrant.example.test',
      },
    ],
  ])('rejects unsafe or incomplete configuration', (configuration) => {
    expect(() => createService(configuration)).toThrow();
    expect(qdrantClientMock).not.toHaveBeenCalled();
  });

  it('lists collection names for a connectivity check', async () => {
    getCollectionsMock.mockResolvedValue({
      collections: [{ name: 'knowledge-base' }, { name: 'products' }],
    });
    const service = createService();

    await expect(service.listCollections()).resolves.toEqual([
      'knowledge-base',
      'products',
    ]);
  });

  it('returns a safe error when Qdrant is unavailable', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    getCollectionsMock.mockRejectedValue(
      new Error('secret provider response must not escape'),
    );
    const service = createService();

    await expect(service.listCollections()).rejects.toThrow(
      new ServiceUnavailableException(
        'Vector database is temporarily unavailable.',
      ),
    );
    expect(Logger.prototype.error).toHaveBeenCalledWith(
      'Unable to list Qdrant collections',
    );
  });

  it('creates a cosine collection when it does not exist', async () => {
    getCollectionsMock.mockResolvedValue({ collections: [] });
    const service = createService();

    await service.ensureCollection('knowledge-base', 1536);

    expect(createCollectionMock).toHaveBeenCalledWith('knowledge-base', {
      vectors: {
        size: 1536,
        distance: 'Cosine',
      },
    });
  });

  it('does not recreate an existing collection', async () => {
    getCollectionsMock.mockResolvedValue({
      collections: [{ name: 'knowledge-base' }],
    });
    const service = createService();

    await service.ensureCollection('knowledge-base', 1536);

    expect(createCollectionMock).not.toHaveBeenCalled();
  });

  it('scrolls through point hashes without loading vectors', async () => {
    scrollMock
      .mockResolvedValueOnce({
        points: [
          {
            id: 'first-id',
            payload: { contentHash: 'first-hash' },
          },
        ],
        next_page_offset: 'first-id',
      })
      .mockResolvedValueOnce({
        points: [
          {
            id: 'second-id',
            payload: {},
          },
        ],
        next_page_offset: null,
      });
    const service = createService();

    await expect(service.listPoints('knowledge-base')).resolves.toEqual([
      { id: 'first-id', contentHash: 'first-hash' },
      { id: 'second-id', contentHash: undefined },
    ]);
    expect(scrollMock).toHaveBeenNthCalledWith(1, 'knowledge-base', {
      limit: 256,
      offset: undefined,
      with_payload: ['contentHash'],
      with_vector: false,
    });
    expect(scrollMock).toHaveBeenNthCalledWith(2, 'knowledge-base', {
      limit: 256,
      offset: 'first-id',
      with_payload: ['contentHash'],
      with_vector: false,
    });
  });

  it('upserts and deletes points with acknowledged writes', async () => {
    const service = createService();
    const points = [
      {
        id: 'point-id',
        vector: [0.1, 0.2],
        payload: { contentHash: 'hash' },
      },
    ];

    await service.upsertPoints('knowledge-base', points);
    await service.deletePoints('knowledge-base', ['stale-id']);

    expect(upsertMock).toHaveBeenCalledWith('knowledge-base', {
      wait: true,
      points,
    });
    expect(deleteMock).toHaveBeenCalledWith('knowledge-base', {
      wait: true,
      points: ['stale-id'],
    });
  });

  function createService(
    configuration: Partial<
      Record<'QDRANT_API_KEY' | 'QDRANT_ENDPOINT', string>
    > = {
      QDRANT_API_KEY: 'test-api-key',
      QDRANT_ENDPOINT: 'http://localhost:6333',
    },
  ): QdrantService {
    const configService = {
      getOrThrow: jest.fn((key: 'QDRANT_API_KEY' | 'QDRANT_ENDPOINT') => {
        if (!(key in configuration)) {
          throw new Error(`Missing ${key}`);
        }

        return configuration[key];
      }),
    } as unknown as ConfigService;

    return new QdrantService(configService);
  }
});
