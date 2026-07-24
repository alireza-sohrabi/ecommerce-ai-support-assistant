'use client';

import classNames from 'classnames';
import {
  type FormEventHandler,
  type KeyboardEventHandler,
  useState,
} from 'react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const fallbackErrorMessage = 'Unable to send your message. Please try again.';
const quickPrompts = [
  'Where is my order?',
  'What is your return policy?',
  'Help me choose a product',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getApiErrorMessage(value: unknown): string {
  if (!isRecord(value)) {
    return fallbackErrorMessage;
  }

  const { message } = value;

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (Array.isArray(message)) {
    const validationMessage = message.find(
      (item): item is string =>
        typeof item === 'string' && Boolean(item.trim()),
    );

    if (validationMessage) {
      return validationMessage;
    }
  }

  return fallbackErrorMessage;
}

function AssistantIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m12 4 .6 2A5 5 0 0 0 16 9.4l2 .6-2 .6a5 5 0 0 0-3.4 3.4l-.6 2-.6-2A5 5 0 0 0 8 10.6L6 10l2-.6A5 5 0 0 0 11.4 6l.6-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Chat() {
  const [draftMessage, setDraftMessage] = useState('');
  const [messageList, setMessageList] = useState<ChatMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (isSubmitting || !draftMessage.trim()) {
      return;
    }

    const submittedMessage = draftMessage.trim();

    setIsSubmitting(true);
    setErrorMessage(null);
    setDraftMessage('');
    setMessageList((previousMessages) => [
      ...previousMessages,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: submittedMessage,
      },
    ]);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            message: submittedMessage,
          }),
        },
      );

      if (!response.ok) {
        const errorResponse: unknown = await response.json().catch(() => null);

        setErrorMessage(getApiErrorMessage(errorResponse));
        setDraftMessage(submittedMessage);
        return;
      }

      const chatResponse: unknown = await response.json();

      if (
        !isRecord(chatResponse) ||
        typeof chatResponse.reply !== 'string' ||
        !chatResponse.reply.trim()
      ) {
        setErrorMessage(fallbackErrorMessage);
        setDraftMessage(submittedMessage);
        return;
      }

      const reply = chatResponse.reply;

      setMessageList((previousMessages) => [
        ...previousMessages,
        {
          content: reply,
          id: `assistant-${Date.now()}`,
          role: 'assistant',
        },
      ]);
    } catch {
      setErrorMessage(fallbackErrorMessage);
      setDraftMessage(submittedMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <section
      aria-label="Customer support chat"
      className="flex min-h-0 w-full flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-slate-50 shadow-[0_32px_90px_rgba(2,6,23,0.38)] ring-1 ring-slate-950/5 max-sm:rounded-b-none"
    >
      <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20">
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8 9h8M8 13h5m-8 7 2.7-2H17a4 4 0 0 0 4-4V7a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v11.5A1.5 1.5 0 0 0 5 20Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-[3px] border-white bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">
              Store support assistant
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Online · Usually replies instantly
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[0.7rem] font-semibold text-slate-500 sm:flex">
          <svg
            className="size-3.5 text-teal-600"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 1.8 3.4 3.7V7c0 2.85 1.96 5.5 4.6 6.2 2.64-.7 4.6-3.35 4.6-6.2V3.7L8 1.8Z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="m5.8 7.4 1.4 1.4 3-3"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Secure AI answers
        </div>
      </header>

      <div
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(219,234,254,0.8),_transparent_42%)] px-4 py-6 sm:px-6 sm:py-7"
      >
        {messageList.length === 0 && (
          <div className="my-auto flex flex-col items-center px-2 py-8 text-center">
            <div className="relative grid size-16 place-items-center rounded-[1.4rem] border border-blue-100 bg-white text-blue-600 shadow-xl shadow-blue-100/60">
              <svg
                className="size-7"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m12 3 .7 2.3A5.7 5.7 0 0 0 16.5 9l2.3.7-2.3.7a5.7 5.7 0 0 0-3.8 3.8L12 16.5l-.7-2.3a5.7 5.7 0 0 0-3.8-3.8l-2.3-.7L7.5 9a5.7 5.7 0 0 0 3.8-3.8L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="m18.5 15 .3 1a2.8 2.8 0 0 0 1.8 1.8l1 .3-1 .3a2.8 2.8 0 0 0-1.8 1.8l-.3 1-.3-1a2.8 2.8 0 0 0-1.8-1.8l-1-.3 1-.3a2.8 2.8 0 0 0 1.8-1.8l.3-1Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
              How can I help today?
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Ask me anything about your order, our products, delivery, or
              returns.
            </p>
            <div className="mt-6 flex max-w-lg flex-wrap justify-center gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setDraftMessage(prompt)}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messageList.map((message) => (
          <div
            key={message.id}
            className={classNames(
              'flex max-w-[88%] items-end gap-2.5 sm:max-w-[78%]',
              message.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto',
            )}
          >
            <div
              className={classNames(
                'grid size-8 shrink-0 place-items-center rounded-xl text-[0.65rem] font-extrabold shadow-sm',
                message.role === 'user'
                  ? 'bg-slate-200 text-slate-600'
                  : 'bg-gradient-to-br from-blue-600 to-teal-500 text-white',
              )}
              aria-hidden="true"
            >
              {message.role === 'user' ? 'YOU' : <AssistantIcon />}
            </div>
            <div>
              <p
                className={classNames(
                  'mb-1 px-1 text-[0.68rem] font-bold tracking-wide uppercase',
                  message.role === 'user'
                    ? 'text-right text-slate-400'
                    : 'text-slate-400',
                )}
              >
                {message.role === 'user' ? 'You' : 'Assistant'}
              </p>
              <div
                className={classNames(
                  'break-words whitespace-pre-wrap px-4 py-3 text-sm leading-6 shadow-sm',
                  message.role === 'user'
                    ? 'rounded-2xl rounded-br-md bg-blue-600 text-white shadow-blue-200/50'
                    : 'rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-700',
                )}
              >
                <p>{message.content}</p>
              </div>
            </div>
          </div>
        ))}

        {isSubmitting && (
          <div
            className="mr-auto flex items-end gap-2.5"
            aria-label="Assistant is typing"
          >
            <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-sm">
              <AssistantIcon />
            </div>
            <div className="flex h-11 items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 shadow-sm">
              <span className="typing-dot size-1.5 rounded-full bg-slate-400" />
              <span className="typing-dot size-1.5 rounded-full bg-slate-400" />
              <span className="typing-dot size-1.5 rounded-full bg-slate-400" />
            </div>
          </div>
        )}
      </div>

      <form
        className="border-t border-slate-200/80 bg-white p-4 sm:p-5"
        onSubmit={handleSubmit}
      >
        {errorMessage && (
          <div
            className="mb-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
            role="alert"
          >
            <svg
              className="mt-0.5 size-4 shrink-0"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="8"
                cy="8"
                r="6.25"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M8 4.7v3.6M8 11.1v.1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <label className="sr-only" htmlFor="chat-message">
          Message
        </label>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100/70">
          <textarea
            id="chat-message"
            name="message"
            maxLength={2000}
            rows={2}
            placeholder="Ask about an order, product, or store policy…"
            className="block max-h-32 min-h-14 w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            value={draftMessage}
            disabled={isSubmitting}
            onChange={(event) => setDraftMessage(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center justify-between gap-3 px-1 pt-1">
            <div className="flex items-center gap-2 text-[0.68rem] text-slate-400">
              <span className="hidden sm:inline">
                Enter to send · Shift + Enter for a new line
              </span>
              <span aria-label={`${draftMessage.length} of 2000 characters`}>
                {draftMessage.length}/2000
              </span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !draftMessage.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <span>{isSubmitting ? 'Sending…' : 'Send'}</span>
              <svg
                className="size-4"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m17 3-6.2 14-2.2-5.6L3 9.2 17 3Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="m8.6 11.4 3.3-3.3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-[0.67rem] text-slate-400">
          AI can make mistakes. Check important information before acting.
        </p>
      </form>
    </section>
  );
}
