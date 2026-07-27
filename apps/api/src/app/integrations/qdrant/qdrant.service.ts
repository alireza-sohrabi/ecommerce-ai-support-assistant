import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import {
  VectorDatabaseService,
  type StoredVectorPoint,
  type VectorPoint,
  type VectorSearchResult,
} from '@api/ports/vector-database/vector-database.service';
import { readRequiredString } from '@api/shared/utils/configuration.util';

@Injectable()
export class QdrantService extends VectorDatabaseService {
  private readonly client: QdrantClient;
  private readonly logger = new Logger(QdrantService.name);

  constructor(configService: ConfigService) {
    super();

    const url = this.readUrl(configService);
    const apiKey = readRequiredString(configService, 'QDRANT_API_KEY');

    this.client = new QdrantClient({
      url,
      apiKey,
    });
  }

  async listCollections(): Promise<string[]> {
    try {
      const response = await this.client.getCollections();

      return response.collections.map(({ name }) => name);
    } catch {
      this.logger.error('Unable to list Qdrant collections');

      throw new ServiceUnavailableException(
        'Vector database is temporarily unavailable.',
      );
    }
  }

  async ensureCollection(
    collectionName: string,
    vectorSize: number,
  ): Promise<void> {
    const collections = await this.listCollections();

    if (collections.includes(collectionName)) {
      return;
    }

    try {
      await this.client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      });
    } catch {
      this.throwUnavailable('Unable to create Qdrant collection');
    }
  }

  async listPoints(collectionName: string): Promise<StoredVectorPoint[]> {
    const points: StoredVectorPoint[] = [];
    let offset: number | string | Record<string, unknown> | undefined;

    try {
      do {
        const response = await this.client.scroll(collectionName, {
          limit: 256,
          offset,
          with_payload: ['contentHash'],
          with_vector: false,
        });

        points.push(
          ...response.points.map((point) => ({
            id: point.id,
            contentHash:
              typeof point.payload?.contentHash === 'string'
                ? point.payload.contentHash
                : undefined,
          })),
        );
        offset = response.next_page_offset ?? undefined;
      } while (offset !== undefined);

      return points;
    } catch {
      this.throwUnavailable('Unable to inspect Qdrant points');
    }
  }

  async upsertPoints(
    collectionName: string,
    points: VectorPoint[],
  ): Promise<void> {
    if (points.length === 0) {
      return;
    }

    try {
      await this.client.upsert(collectionName, {
        wait: true,
        points,
      });
    } catch {
      this.throwUnavailable('Unable to upsert Qdrant points');
    }
  }

  async deletePoints(
    collectionName: string,
    pointIds: Array<number | string>,
  ): Promise<void> {
    if (pointIds.length === 0) {
      return;
    }

    try {
      await this.client.delete(collectionName, {
        wait: true,
        points: pointIds,
      });
    } catch {
      this.throwUnavailable('Unable to delete stale Qdrant points');
    }
  }

  async search(
    collectionName: string,
    vector: number[],
    limit: number,
    scoreThreshold: number,
  ): Promise<VectorSearchResult[]> {
    try {
      const results = await this.client.search(collectionName, {
        vector,
        limit,
        score_threshold: scoreThreshold,
        with_payload: true,
        with_vector: false,
      });

      return results.map((result) => ({
        id: result.id,
        score: result.score,
        payload: result.payload ?? {},
      }));
    } catch {
      this.throwUnavailable('Unable to search Qdrant points');
    }
  }

  private readUrl(configService: ConfigService): string {
    const value = readRequiredString(configService, 'QDRANT_ENDPOINT');
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(value);
    } catch {
      throw new Error('QDRANT_ENDPOINT must be a valid absolute URL');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('QDRANT_ENDPOINT must use HTTP or HTTPS');
    }

    if (parsedUrl.username || parsedUrl.password) {
      throw new Error('QDRANT_ENDPOINT must not contain credentials');
    }

    return parsedUrl.toString().replace(/\/$/, '');
  }

  private throwUnavailable(logMessage: string): never {
    this.logger.error(logMessage);

    throw new ServiceUnavailableException(
      'Vector database is temporarily unavailable.',
    );
  }
}
