import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { EmbeddingService } from '@api/ports/embedding/embedding.service';
import {
  VectorDatabaseService,
  type VectorSearchResult,
} from '@api/ports/vector-database/vector-database.service';
import type { KnowledgeChunk } from './knowledge-chunk';
import {
  KNOWLEDGE_BASE_SETTINGS,
  type KnowledgeBaseSettings,
} from './knowledge-base-settings';

export type RetrievedKnowledgeChunk = KnowledgeChunk & {
  score: number;
};

@Injectable()
export class KnowledgeBaseRetrievalService {
  private readonly logger = new Logger(KnowledgeBaseRetrievalService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorDatabase: VectorDatabaseService,
    @Inject(KNOWLEDGE_BASE_SETTINGS)
    private readonly settings: KnowledgeBaseSettings,
  ) {}

  async retrieve(query: string): Promise<RetrievedKnowledgeChunk[]> {
    try {
      const embeddings =
        await this.embeddingService.generateEmbeddings([query]);
      const queryVector = embeddings[0];

      if (
        embeddings.length !== 1 ||
        queryVector.length !== this.embeddingService.getDimensions() ||
        queryVector.some((value) => !Number.isFinite(value))
      ) {
        throw new Error('Invalid query embedding');
      }

      const results = await this.vectorDatabase.search(
        this.settings.collectionName,
        queryVector,
        this.settings.retrievalLimit,
        this.settings.retrievalScoreThreshold,
      );

      return results
        .filter(
          ({ score }) => score >= this.settings.retrievalScoreThreshold,
        )
        .slice(0, this.settings.retrievalLimit)
        .map((result) => this.parseResult(result))
        .filter((chunk): chunk is RetrievedKnowledgeChunk => chunk !== null);
    } catch {
      this.logger.error('Unable to retrieve knowledge-base context');

      throw new ServiceUnavailableException(
        'Knowledge retrieval is temporarily unavailable.',
      );
    }
  }

  private parseResult(
    result: VectorSearchResult,
  ): RetrievedKnowledgeChunk | null {
    const { payload } = result;
    const requiredStrings = [
      'sourcePath',
      'category',
      'documentTitle',
      'sectionTitle',
      'content',
      'contentHash',
    ] as const;

    if (
      !Number.isFinite(result.score) ||
      !requiredStrings.every(
        (key) =>
          typeof payload[key] === 'string' && payload[key].trim().length > 0,
      ) ||
      !Number.isInteger(payload.sectionIndex) ||
      (payload.sectionIndex as number) < 0
    ) {
      return null;
    }

    return {
      id: String(result.id),
      sourcePath: payload.sourcePath as string,
      category: payload.category as string,
      documentTitle: payload.documentTitle as string,
      sectionTitle: payload.sectionTitle as string,
      sectionIndex: payload.sectionIndex as number,
      content: payload.content as string,
      contentHash: payload.contentHash as string,
      score: result.score,
    };
  }
}
