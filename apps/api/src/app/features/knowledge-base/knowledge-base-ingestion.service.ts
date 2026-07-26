import { Injectable } from '@nestjs/common';
import type { KnowledgeChunk } from './knowledge-chunk';
import { MarkdownChunkerService } from './markdown-chunker.service';
import { MarkdownDocumentLoader } from './markdown-document-loader.service';

@Injectable()
export class KnowledgeBaseIngestionService {
  constructor(
    private readonly loader: MarkdownDocumentLoader,
    private readonly chunker: MarkdownChunkerService,
  ) {}

  async prepareChunks(): Promise<KnowledgeChunk[]> {
    const documents = await this.loader.loadDocuments();

    return documents.flatMap((document) => this.chunker.chunk(document));
  }
}
