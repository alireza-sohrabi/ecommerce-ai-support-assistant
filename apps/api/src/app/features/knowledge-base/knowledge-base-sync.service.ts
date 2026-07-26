import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from '@api/ports/embedding/embedding.service';
import {
  createKnowledgeChunkEmbeddingInput,
  type KnowledgeChunk,
} from './knowledge-chunk';
import { KnowledgeBaseIngestionService } from './knowledge-base-ingestion.service';
import {
  VectorDatabaseService,
  type VectorPoint,
} from '@api/ports/vector-database/vector-database.service';
import { readRequiredString } from '@api/shared/utils/configuration.util';

export interface KnowledgeBaseSyncSummary {
  deleted: number;
  embedded: number;
  total: number;
  unchanged: number;
  upserted: number;
}

@Injectable()
export class KnowledgeBaseSyncService {
  constructor(
    private readonly ingestion: KnowledgeBaseIngestionService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorDatabase: VectorDatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async synchronize(): Promise<KnowledgeBaseSyncSummary> {
    const chunks = await this.ingestion.prepareChunks();
    const collectionName = readRequiredString(
      this.configService,
      'KNOWLEDGE_BASE_VECTOR_COLLECTION',
    );
    const vectorSize = this.embeddingService.getDimensions();

    await this.vectorDatabase.ensureCollection(collectionName, vectorSize);

    const storedPoints = await this.vectorDatabase.listPoints(collectionName);
    const storedHashes = new Map(
      storedPoints.map(({ id, contentHash }) => [String(id), contentHash]),
    );
    const currentIds = new Set(chunks.map(({ id }) => id));
    const changedChunks = chunks.filter(
      (chunk) => storedHashes.get(chunk.id) !== chunk.contentHash,
    );
    const staleIds = storedPoints
      .filter(({ id }) => !currentIds.has(String(id)))
      .map(({ id }) => id);
    const embeddings =
      changedChunks.length === 0
        ? []
        : await this.embeddingService.generateEmbeddings(
            changedChunks.map(createKnowledgeChunkEmbeddingInput),
          );
    const points = this.createVectorPoints(
      changedChunks,
      embeddings,
      vectorSize,
    );

    await this.vectorDatabase.upsertPoints(collectionName, points);
    await this.vectorDatabase.deletePoints(collectionName, staleIds);

    return {
      total: chunks.length,
      unchanged: chunks.length - changedChunks.length,
      embedded: embeddings.length,
      upserted: points.length,
      deleted: staleIds.length,
    };
  }

  private createVectorPoints(
    chunks: KnowledgeChunk[],
    embeddings: number[][],
    vectorSize: number,
  ): VectorPoint[] {
    if (embeddings.length !== chunks.length) {
      throw new Error(
        'Embedding response count does not match changed chunk count',
      );
    }

    return chunks.map((chunk, index) => {
      const vector = embeddings[index];

      if (vector.length !== vectorSize) {
        throw new Error(
          `Embedding for chunk "${chunk.id}" has an unexpected size`,
        );
      }

      return {
        id: chunk.id,
        vector,
        payload: {
          sourcePath: chunk.sourcePath,
          category: chunk.category,
          documentTitle: chunk.documentTitle,
          sectionTitle: chunk.sectionTitle,
          sectionIndex: chunk.sectionIndex,
          content: chunk.content,
          contentHash: chunk.contentHash,
        },
      };
    });
  }
}
