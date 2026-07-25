import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class QdrantService {
  private readonly client: QdrantClient;
  private readonly logger = new Logger(QdrantService.name);

  constructor(configService: ConfigService) {
    const url = this.readUrl(configService);
    const apiKey = this.readRequiredValue(configService, 'QDRANT_API_KEY');

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

  private readUrl(configService: ConfigService): string {
    const value = this.readRequiredValue(configService, 'QDRANT_ENDPOINT');
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

  private readRequiredValue(
    configService: ConfigService,
    key: 'QDRANT_API_KEY' | 'QDRANT_ENDPOINT',
  ): string {
    const value = configService.getOrThrow<string>(key).trim();

    if (!value) {
      throw new Error(`${key} must not be empty`);
    }

    return value;
  }
}
