import { Module } from '@nestjs/common';
import {
  QdrantModule,
  QdrantService,
} from '@api/integrations/qdrant';
import { VectorDatabaseService } from './vector-database.service';

@Module({
  imports: [QdrantModule],
  providers: [
    {
      provide: VectorDatabaseService,
      useExisting: QdrantService,
    },
  ],
  exports: [VectorDatabaseService],
})
export class KnowledgeBaseModule {}
