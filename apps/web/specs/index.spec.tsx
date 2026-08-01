import React from 'react';
import { TextDecoder, TextEncoder } from 'node:util';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Page from '../src/app/page';
import { Chat } from '../src/app/features/chat/chat';

const apiBaseUrl = 'http://localhost:3001';
const originalFetch = global.fetch;
const originalTextDecoder = global.TextDecoder;
const fetchMock = jest.fn<typeof fetch>();
const encoder = new TextEncoder();

type StreamEvent =
  | { type: 'delta'; text: string }
  | {
      type: 'complete';
      sources?: Array<{
        documentTitle: string;
        sectionTitle: string;
        sourcePath: string;
      }>;
    }
  | { type: 'error'; message: string };

function submitMessage(message: string) {
  fireEvent.change(screen.getByLabelText('Message'), {
    target: { value: message },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
}

function createStreamingResponseFromChunks(chunks: string[]): Response {
  let chunkIndex = 0;

  return {
    body: {
      getReader: () => ({
        cancel: jest.fn().mockResolvedValue(undefined),
        read: jest.fn(async () => {
          if (chunkIndex >= chunks.length) {
            return { done: true, value: undefined };
          }

          const value = encoder.encode(chunks[chunkIndex]);
          chunkIndex += 1;
          return { done: false, value };
        }),
        releaseLock: jest.fn(),
      }),
    },
    ok: true,
  } as unknown as Response;
}

function createStreamingResponse(events: StreamEvent[]): Response {
  return createStreamingResponseFromChunks(
    events.map((event) => `${JSON.stringify(event)}\n`),
  );
}

function createReplyResponse(reply: string): Response {
  return createStreamingResponse([
    { type: 'delta', text: reply },
    { type: 'complete', sources: [] },
  ]);
}

describe('Page', () => {
  it('should identify the application', () => {
    render(<Page />);

    expect(
      screen.getByRole('heading', {
        name: 'Every shopper deserves a helpful answer.',
      }),
    ).toBeTruthy();
  });
});

describe('Chat', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = apiBaseUrl;
    fetchMock.mockReset();
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
      writable: true,
    });
    Object.defineProperty(global, 'TextDecoder', {
      configurable: true,
      value: TextDecoder,
      writable: true,
    });
  });

  afterAll(() => {
    if (originalFetch) {
      Object.defineProperty(global, 'fetch', {
        configurable: true,
        value: originalFetch,
        writable: true,
      });
    } else {
      Reflect.deleteProperty(global, 'fetch');
    }

    if (originalTextDecoder) {
      Object.defineProperty(global, 'TextDecoder', {
        configurable: true,
        value: originalTextDecoder,
        writable: true,
      });
    } else {
      Reflect.deleteProperty(global, 'TextDecoder');
    }
  });

  it('renders streamed deltas and final source metadata', async () => {
    const firstEvent = '{"type":"delta","text":"Your order is currently being ';
    const remainingEvents =
      'processed."}\n' +
      `${JSON.stringify({
        type: 'complete',
        sources: [
          {
            documentTitle: 'Order Tracking Guide',
            sectionTitle: 'Finding your tracking link',
            sourcePath: 'guides/order-tracking.md',
          },
        ],
      })}\n`;

    fetchMock.mockResolvedValue(
      createStreamingResponseFromChunks([
        firstEvent.slice(0, 23),
        firstEvent.slice(23),
        remainingEvents,
      ]),
    );

    render(<Chat />);
    submitMessage('Where is my order?');

    expect(
      screen.getByText('Where is my order?', { selector: 'p' }),
    ).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(`${apiBaseUrl}/api/chat`, {
      headers: {
        Accept: 'application/x-ndjson',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: expect.any(AbortSignal),
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Where is my order?',
          },
        ],
      }),
    });
    expect(
      await screen.findByText('Your order is currently being processed.'),
    ).toBeTruthy();
    expect(
      screen.getByRole('region', {
        name: 'Sources for assistant response',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Order Tracking Guide')).toBeTruthy();
    expect(screen.getByText('Finding your tracking link')).toBeTruthy();
    expect(screen.getByText('guides/order-tracking.md')).toBeTruthy();
  });

  it('accepts complete events without source metadata', async () => {
    fetchMock.mockResolvedValue(
      createStreamingResponse([
        {
          type: 'delta',
          text: 'No sources were returned for this response.',
        },
        { type: 'complete' },
      ]),
    );

    render(<Chat />);
    submitMessage('Test a response without sources');

    expect(
      await screen.findByText('No sources were returned for this response.'),
    ).toBeTruthy();
    expect(
      screen.queryByRole('region', {
        name: 'Sources for assistant response',
      }),
    ).toBeNull();
  });

  it('includes previous messages in a follow-up request', async () => {
    fetchMock
      .mockResolvedValueOnce(createReplyResponse('What is your order number?'))
      .mockResolvedValueOnce(
        createReplyResponse('Your order is being processed.'),
      );

    render(<Chat />);
    submitMessage('Where is my order?');
    await screen.findByText('What is your order number?');

    submitMessage('ORDER-123');

    await screen.findByText('Your order is being processed.');
    expect(fetchMock).toHaveBeenLastCalledWith(`${apiBaseUrl}/api/chat`, {
      headers: {
        Accept: 'application/x-ndjson',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: expect.any(AbortSignal),
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Where is my order?',
          },
          {
            role: 'assistant',
            content: 'What is your order number?',
          },
          {
            role: 'user',
            content: 'ORDER-123',
          },
        ],
      }),
    });
  });

  it('limits the request history to 10 messages', async () => {
    fetchMock.mockImplementation(async (_input, init) => {
      const requestBody = JSON.parse(String(init?.body)) as {
        messages: Array<{ content: string; role: 'assistant' | 'user' }>;
      };
      const latestMessage = requestBody.messages.at(-1);

      return createReplyResponse(`Reply to ${latestMessage?.content}`);
    });

    render(<Chat />);

    for (let turn = 1; turn <= 6; turn += 1) {
      submitMessage(`Question ${turn}`);
      await screen.findByText(`Reply to Question ${turn}`);
    }

    const sixthRequest = fetchMock.mock.calls[5]?.[1];
    const sixthRequestBody = JSON.parse(String(sixthRequest?.body)) as {
      messages: Array<{ content: string; role: 'assistant' | 'user' }>;
    };

    expect(sixthRequestBody.messages).toHaveLength(10);
    expect(sixthRequestBody.messages[0]).toEqual({
      role: 'assistant',
      content: 'Reply to Question 1',
    });
    expect(sixthRequestBody.messages[9]).toEqual({
      role: 'user',
      content: 'Question 6',
    });
  });

  it('cancels an active stream with the Stop button', async () => {
    let requestSignal: AbortSignal | undefined;

    fetchMock.mockImplementation(async (_input, init) => {
      requestSignal = init?.signal ?? undefined;
      let readCount = 0;

      return {
        body: {
          getReader: () => ({
            cancel: jest.fn().mockResolvedValue(undefined),
            read: jest.fn(() => {
              readCount += 1;

              if (readCount === 1) {
                return Promise.resolve({
                  done: false,
                  value: encoder.encode(
                    '{"type":"delta","text":"A partial reply"}\n',
                  ),
                });
              }

              return new Promise((_, reject) => {
                requestSignal?.addEventListener('abort', () => {
                  reject(
                    new DOMException('The request was aborted.', 'AbortError'),
                  );
                });
              });
            }),
            releaseLock: jest.fn(),
          }),
        },
        ok: true,
      } as unknown as Response;
    });

    render(<Chat />);
    submitMessage('Can I return this item?');

    await screen.findByText('A partial reply');
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    await waitFor(() => expect(requestSignal?.aborted).toBe(true));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy(),
    );
    expect(screen.queryByText('A partial reply')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the safe backend message when the request fails before streaming', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({
        message:
          'AI service is temporarily unavailable. Please try again later.',
      }),
    } as unknown as Response);

    render(<Chat />);
    submitMessage('Where is my order?');

    const alert = await screen.findByRole('alert');

    expect(alert.textContent).toBe(
      'AI service is temporarily unavailable. Please try again later.',
    );
    expect(
      (screen.getByLabelText('Message') as HTMLTextAreaElement).value,
    ).toBe('Where is my order?');
  });

  it('shows a streamed error and removes the incomplete assistant reply', async () => {
    fetchMock.mockResolvedValue(
      createStreamingResponse([
        { type: 'delta', text: 'An incomplete reply' },
        {
          type: 'error',
          message: 'The response could not be completed. Please try again.',
        },
      ]),
    );

    render(<Chat />);
    submitMessage('Where is my order?');

    const alert = await screen.findByRole('alert');

    expect(alert.textContent).toBe(
      'The response could not be completed. Please try again.',
    );
    expect(screen.queryByText('An incomplete reply')).toBeNull();
  });
});
