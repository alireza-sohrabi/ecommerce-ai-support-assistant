import type { ChatSource } from './ChatResponse';

export type ChatStreamEvent =
  | {
      type: 'delta';
      text: string;
    }
  | {
      type: 'complete';
      sources: ChatSource[];
    }
  | {
      type: 'error';
      message: string;
    };
