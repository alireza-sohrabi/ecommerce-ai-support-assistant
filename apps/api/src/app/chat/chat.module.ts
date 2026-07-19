import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OpenAIModule } from '@api/integrations/openai';

@Module({
  imports: [OpenAIModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
