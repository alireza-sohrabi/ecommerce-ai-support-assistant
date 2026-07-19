import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(200)
  async chat(
    @Body() chatRequestDto: ChatRequestDto,
  ): Promise<{ reply: string }> {
    const reply = await this.chatService.processMessage(chatRequestDto.message);

    return {
      reply,
    };
  }
}
