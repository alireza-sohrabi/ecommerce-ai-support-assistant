import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AiApiModule } from '../ai-api/ai-api.module';

@Module({
  imports: [AiApiModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
