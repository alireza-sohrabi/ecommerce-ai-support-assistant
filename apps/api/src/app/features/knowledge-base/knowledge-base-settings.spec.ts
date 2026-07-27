import { ConfigService } from '@nestjs/config';
import { createKnowledgeBaseSettings } from './knowledge-base-settings';

describe('createKnowledgeBaseSettings', () => {
  it('reads and validates all knowledge-base settings', () => {
    const configService = createConfigService({
      KNOWLEDGE_BASE_VECTOR_COLLECTION: ' knowledge-base ',
      KNOWLEDGE_BASE_RETRIEVAL_LIMIT: '4',
      KNOWLEDGE_BASE_RETRIEVAL_SCORE_THRESHOLD: '0.7',
    });

    expect(createKnowledgeBaseSettings(configService)).toEqual({
      collectionName: 'knowledge-base',
      retrievalLimit: 4,
      retrievalScoreThreshold: 0.7,
    });
  });

  it.each(['-0.1', '1.1', 'not-a-number'])(
    'rejects invalid retrieval score threshold %s',
    (retrievalScoreThreshold) => {
      const configService = createConfigService({
        KNOWLEDGE_BASE_VECTOR_COLLECTION: 'knowledge-base',
        KNOWLEDGE_BASE_RETRIEVAL_LIMIT: '4',
        KNOWLEDGE_BASE_RETRIEVAL_SCORE_THRESHOLD: retrievalScoreThreshold,
      });

      expect(() => createKnowledgeBaseSettings(configService)).toThrow(
        'KNOWLEDGE_BASE_RETRIEVAL_SCORE_THRESHOLD must be between 0 and 1',
      );
    },
  );
});

function createConfigService(
  configuration: Record<string, string>,
): ConfigService {
  return {
    getOrThrow: jest.fn((key: string) => configuration[key]),
  } as unknown as ConfigService;
}
