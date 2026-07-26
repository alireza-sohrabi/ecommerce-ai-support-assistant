import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EmbeddingService } from '@api/ports/embedding/embedding.service';
import {
  readPositiveInteger,
  readRequiredString,
} from '@api/shared/utils/configuration.util';
import { OPENAI_CLIENT } from './openai-client.constant';

@Injectable()
export class OpenAIEmbeddingService implements EmbeddingService {
  private static readonly BATCH_SIZE = 100;
  private readonly logger = new Logger(OpenAIEmbeddingService.name);

  constructor(
    @Inject(OPENAI_CLIENT) private readonly client: OpenAI,
    private readonly configService: ConfigService,
  ) {}

  getDimensions(): number {
    return readPositiveInteger(
      this.configService,
      'OPENAI_EMBEDDING_DIMENSIONS',
    );
  }

  async generateEmbeddings(input: string[]): Promise<number[][]> {
    if (input.length === 0) {
      return [];
    }

    const model = readRequiredString(
      this.configService,
      'OPENAI_EMBEDDING_MODEL',
    );
    const dimensions = this.getDimensions();
    const embeddings: number[][] = [];

    try {
      for (
        let offset = 0;
        offset < input.length;
        offset += OpenAIEmbeddingService.BATCH_SIZE
      ) {
        const batch = input.slice(
          offset,
          offset + OpenAIEmbeddingService.BATCH_SIZE,
        );
        const response = await this.client.embeddings.create({
          model,
          input: batch,
          dimensions,
          encoding_format: 'float',
        });
        const orderedBatch = [...response.data].sort(
          (left, right) => left.index - right.index,
        );

        embeddings.push(...orderedBatch.map(({ embedding }) => embedding));
      }

      if (embeddings.length !== input.length) {
        throw new Error('Embedding response count does not match input count');
      }

      return embeddings;
    } catch {
      this.logger.error('Unable to generate OpenAI embeddings');

      throw new ServiceUnavailableException(
        'Embedding service is temporarily unavailable.',
      );
    }
  }
}
