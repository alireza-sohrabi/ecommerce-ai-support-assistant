import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { OPENAI_CLIENT } from './openai-client.constant';
import { OpenAIEmbeddingService } from './openai-embedding.service';

describe('OpenAIEmbeddingService', () => {
  let service: OpenAIEmbeddingService;
  let testingModule: TestingModule;

  const createEmbeddingMock = jest.fn();
  const getOrThrowMock = jest.fn();

  beforeEach(async () => {
    createEmbeddingMock.mockResolvedValue({
      data: [
        { index: 1, embedding: [0.3, 0.4] },
        { index: 0, embedding: [0.1, 0.2] },
      ],
    });
    getOrThrowMock.mockImplementation((key: string) => {
      const configuration: Record<string, string> = {
        OPENAI_EMBEDDING_MODEL: 'text-embedding-3-small',
        OPENAI_EMBEDDING_DIMENSIONS: '2',
      };

      return configuration[key];
    });

    testingModule = await Test.createTestingModule({
      providers: [
        OpenAIEmbeddingService,
        {
          provide: OPENAI_CLIENT,
          useValue: {
            embeddings: {
              create: createEmbeddingMock,
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: getOrThrowMock,
          },
        },
      ],
    }).compile();

    service = testingModule.get(OpenAIEmbeddingService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    await testingModule.close();
  });

  it('generates ordered embeddings for multiple inputs', async () => {
    const embeddings = await service.generateEmbeddings([
      'First chunk',
      'Second chunk',
    ]);

    expect(createEmbeddingMock).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: ['First chunk', 'Second chunk'],
      dimensions: 2,
      encoding_format: 'float',
    });
    expect(embeddings).toEqual([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
  });

  it('does not call OpenAI when no embeddings are requested', async () => {
    await expect(service.generateEmbeddings([])).resolves.toEqual([]);
    expect(createEmbeddingMock).not.toHaveBeenCalled();
  });

  it('returns a safe error when embedding generation fails', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    createEmbeddingMock.mockRejectedValueOnce(
      new Error('secret provider response'),
    );

    await expect(
      service.generateEmbeddings(['Knowledge chunk']),
    ).rejects.toThrow(
      new ServiceUnavailableException(
        'Embedding service is temporarily unavailable.',
      ),
    );
    expect(Logger.prototype.error).toHaveBeenCalledWith(
      'Unable to generate OpenAI embeddings',
    );
  });
});
