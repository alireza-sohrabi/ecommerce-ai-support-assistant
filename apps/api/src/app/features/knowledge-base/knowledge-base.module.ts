import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import path from 'node:path';
import { KNOWLEDGE_BASE_ROOT } from './knowledge-base-root.constant';
import { KnowledgeBaseIngestionService } from './knowledge-base-ingestion.service';
import { KnowledgeBaseRetrievalService } from './knowledge-base-retrieval.service';
import { KnowledgeBaseSyncService } from './knowledge-base-sync.service';
import {
  createKnowledgeBaseSettings,
  KNOWLEDGE_BASE_SETTINGS,
} from './knowledge-base-settings';
import { MarkdownChunkerService } from './markdown-chunker.service';
import { MarkdownDocumentLoader } from './markdown-document-loader.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: KNOWLEDGE_BASE_SETTINGS,
      inject: [ConfigService],
      useFactory: createKnowledgeBaseSettings,
    },
    {
      provide: KNOWLEDGE_BASE_ROOT,
      useFactory: () =>
        path.resolve(process.cwd(), 'apps/api/content/knowledge-base'),
    },
    MarkdownDocumentLoader,
    MarkdownChunkerService,
    KnowledgeBaseIngestionService,
    KnowledgeBaseRetrievalService,
    KnowledgeBaseSyncService,
  ],
  exports: [
    KnowledgeBaseRetrievalService,
    KnowledgeBaseSyncService,
  ],
})
export class KnowledgeBaseModule {}
