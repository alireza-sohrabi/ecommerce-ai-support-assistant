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
        message: 'Where is my order?',
      }),
    });
    expect(
      await screen.findByText('Your order is currently being processed.'),
    ).toBeTruthy();
    expect(
      (screen.getByLabelText('Message') as HTMLTextAreaElement).value,
    ).toBe('');
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
