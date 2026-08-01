import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatRequestDto } from './dto/chat-request.dto';
import type { ChatStreamEvent } from './interface/ChatStreamEvent';
import { ChatService } from './chat.service';

export const CHAT_STREAM_ERROR_MESSAGE =
  'The response could not be completed. Please try again.';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(200)
  async chat(
    @Body() chatRequestDto: ChatRequestDto,
    @Res() response: Response,
  ): Promise<void> {
    const abortController = new AbortController();
    const handleClose = () => abortController.abort();

    response.on('close', handleClose);
    response.status(200);
    response.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders();

    try {
      for await (const event of this.chatService.streamMessage(
        chatRequestDto.messages,
        abortController.signal,
      )) {
        if (abortController.signal.aborted || response.writableEnded) {
          break;
        }

        this.writeEvent(response, event);
      }
    } catch {
      if (!abortController.signal.aborted && !response.writableEnded) {
        this.writeEvent(response, {
          type: 'error',
          message: CHAT_STREAM_ERROR_MESSAGE,
        });
      }
    } finally {
      response.off('close', handleClose);

      if (!response.writableEnded) {
        response.end();
      }
    }
  }

  private writeEvent(response: Response, event: ChatStreamEvent): void {
    response.write(`${JSON.stringify(event)}\n`);
  }
}
