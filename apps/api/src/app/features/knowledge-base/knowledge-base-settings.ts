import { ConfigService } from '@nestjs/config';
import {
  readPositiveInteger,
  readRequiredString,
} from '@api/shared/utils/configuration.util';

export interface KnowledgeBaseSettings {
  collectionName: string;
  retrievalLimit: number;
  retrievalScoreThreshold: number;
}

export const KNOWLEDGE_BASE_SETTINGS = Symbol('KNOWLEDGE_BASE_SETTINGS');

export function createKnowledgeBaseSettings(
  configService: ConfigService,
): KnowledgeBaseSettings {
  const retrievalScoreThreshold = Number(
    readRequiredString(
      configService,
      'KNOWLEDGE_BASE_RETRIEVAL_SCORE_THRESHOLD',
    ),
  );

  if (
    !Number.isFinite(retrievalScoreThreshold) ||
    retrievalScoreThreshold < 0 ||
    retrievalScoreThreshold > 1
  ) {
    throw new Error(
      'KNOWLEDGE_BASE_RETRIEVAL_SCORE_THRESHOLD must be between 0 and 1',
    );
  }

  return {
    collectionName: readRequiredString(
      configService,
      'KNOWLEDGE_BASE_VECTOR_COLLECTION',
    ),
    retrievalLimit: readPositiveInteger(
      configService,
      'KNOWLEDGE_BASE_RETRIEVAL_LIMIT',
    ),
    retrievalScoreThreshold,
  };
}
