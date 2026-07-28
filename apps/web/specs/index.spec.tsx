import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Page from '../src/app/page';
import { Chat } from '../src/app/features/chat/chat';

const apiBaseUrl = 'http://localhost:3001';
const originalFetch = global.fetch;
const fetchMock = jest.fn<typeof fetch>();

function submitMessage(message: string) {
  fireEvent.change(screen.getByLabelText('Message'), {
    target: { value: message },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
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
  });

  it('submits a message and renders the assistant reply', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        reply: 'Your order is currently being processed.',
        sources: [
          {
            documentTitle: 'Order Tracking Guide',
            sectionTitle: 'Finding your tracking link',
            sourcePath: 'guides/order-tracking.md',
          },
        ],
      }),
    } as unknown as Response);

    render(<Chat />);
    submitMessage('Where is my order?');

    expect(
      screen.getByText('Where is my order?', { selector: 'p' }),
    ).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(`${apiBaseUrl}/api/chat`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
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
    expect(
      (screen.getByLabelText('Message') as HTMLTextAreaElement).value,
    ).toBe('');
  });

  it('accepts legacy responses without a sources field', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        reply: 'No sources were returned for this response.',
      }),
    } as unknown as Response);

    render(<Chat />);
    submitMessage('Test a legacy response');

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
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          reply: 'What is your order number?',
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          reply: 'Your order is being processed.',
        }),
      } as unknown as Response);

    render(<Chat />);
    submitMessage('Where is my order?');
    await screen.findByText('What is your order number?');

    submitMessage('ORDER-123');

    expect(fetchMock).toHaveBeenLastCalledWith(`${apiBaseUrl}/api/chat`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
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
    expect(
      await screen.findByText('Your order is being processed.'),
    ).toBeTruthy();
  });

  it('limits the request history to 10 messages', async () => {
    fetchMock.mockImplementation(async (_input, init) => {
      const requestBody = JSON.parse(String(init?.body)) as {
        messages: Array<{ content: string; role: 'assistant' | 'user' }>;
      };
      const latestMessage = requestBody.messages.at(-1);

      return {
        ok: true,
        json: jest.fn().mockResolvedValue({
          reply: `Reply to ${latestMessage?.content}`,
        }),
      } as unknown as Response;
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

  it('shows a loading state while the request is pending', () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));

    render(<Chat />);
    submitMessage('Can I return this item?');

    const sendingButton = screen.getByRole('button', { name: /Sending/ });

    expect((sendingButton as HTMLButtonElement).disabled).toBe(true);
    expect(
      (screen.getByLabelText('Message') as HTMLTextAreaElement).disabled,
    ).toBe(true);
  });

  it('shows the safe backend message when the request fails', async () => {
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
});
