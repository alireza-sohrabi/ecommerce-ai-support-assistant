import { Module } from '@nestjs/common';
import { KnowledgeBaseModule } from '@api/features/knowledge-base/knowledge-base.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [KnowledgeBaseModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
