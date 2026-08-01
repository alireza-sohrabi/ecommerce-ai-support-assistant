import type { Response } from 'express';
import { CHAT_STREAM_ERROR_MESSAGE, ChatController } from './chat.controller';
import type { ChatService } from './chat.service';

function createResponseMock() {
  const listeners = new Map<string, () => void>();
  let writableEnded = false;

  const response = {
    end: jest.fn(() => {
      writableEnded = true;
    }),
    flushHeaders: jest.fn(),
    off: jest.fn((event: string) => {
      listeners.delete(event);
      return response;
    }),
    on: jest.fn((event: string, listener: () => void) => {
      listeners.set(event, listener);
      return response;
    }),
    setHeader: jest.fn(),
    status: jest.fn(() => response),
    write: jest.fn(),
    get writableEnded() {
      return writableEnded;
    },
  };

  return {
    listeners,
    response: response as unknown as Response,
  };
}

describe('ChatController', () => {
  it('writes each chat event as one NDJSON line', async () => {
    const streamMessage = jest.fn(async function* () {
      yield {
        type: 'delta' as const,
        text: 'Shipping takes 3–7 business days.',
      };
      yield {
        type: 'complete' as const,
        sources: [],
      };
    });
    const controller = new ChatController({
      streamMessage,
    } as unknown as ChatService);
    const { response } = createResponseMock();
    const messages = [
      {
        role: 'user' as const,
        content: 'How long does shipping take?',
      },
    ];

    await controller.chat({ messages }, response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/x-ndjson; charset=utf-8',
    );
    expect(response.write).toHaveBeenNthCalledWith(
      1,
      `${JSON.stringify({
        type: 'delta',
        text: 'Shipping takes 3–7 business days.',
      })}\n`,
    );
    expect(response.write).toHaveBeenNthCalledWith(
      2,
      `${JSON.stringify({
        type: 'complete',
        sources: [],
      })}\n`,
    );
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(streamMessage).toHaveBeenCalledWith(
      messages,
      expect.any(AbortSignal),
    );
  });

  it('writes a safe error event when streaming fails', async () => {
    const streamMessage = jest.fn(async function* () {
      yield {
        type: 'delta' as const,
        text: 'Partial',
      };
      throw new Error('Provider secret');
    });
    const controller = new ChatController({
      streamMessage,
    } as unknown as ChatService);
    const { response } = createResponseMock();

    await controller.chat(
      {
        messages: [
          {
            role: 'user',
            content: 'Where is my order?',
          },
        ],
      },
      response,
    );

    expect(response.write).toHaveBeenLastCalledWith(
      `${JSON.stringify({
        type: 'error',
        message: CHAT_STREAM_ERROR_MESSAGE,
      })}\n`,
    );
    expect(response.end).toHaveBeenCalledTimes(1);
  });

  it('aborts generation when the client connection closes', async () => {
    let receivedSignal: AbortSignal | undefined;
    const streamMessage = jest.fn(async function* (
      _messages,
      signal?: AbortSignal,
    ) {
      receivedSignal = signal;
      await new Promise<void>((resolve) => {
        signal?.addEventListener('abort', () => resolve(), { once: true });
      });
      yield {
        type: 'delta' as const,
        text: 'This event must not be written after cancellation.',
      };
    });
    const controller = new ChatController({
      streamMessage,
    } as unknown as ChatService);
    const { listeners, response } = createResponseMock();

    const request = controller.chat(
      {
        messages: [
          {
            role: 'user',
            content: 'Where is my order?',
          },
        ],
      },
      response,
    );

    await Promise.resolve();
    listeners.get('close')?.();
    await request;

    expect(receivedSignal?.aborted).toBe(true);
    expect(response.write).not.toHaveBeenCalled();
    expect(response.end).toHaveBeenCalledTimes(1);
  });
});
