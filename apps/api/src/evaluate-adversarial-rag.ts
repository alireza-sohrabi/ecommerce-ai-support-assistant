import 'reflect-metadata';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { AiApiService } from '@api/ports/ai-api/ai-api.service';
import { ChatService } from '@api/features/chat/chat.service';
import {
  ADVERSARIAL_RAG_EVALUATION_CASES,
  type AdversarialRagEvaluationCase,
} from '@api/features/chat/adversarial-rag.evaluation-cases';
import {
  evaluateAdversarialRag,
  type AdversarialRagEvaluationResult,
} from '@api/features/chat/adversarial-rag.evaluator';
import type { KnowledgeBaseRetrievalService } from '@api/features/knowledge-base/knowledge-base-retrieval.service';

const evaluationStartedAt = new Date();
const evaluationTimestamp = evaluationStartedAt
  .toISOString()
  .replace(/[:.]/g, '-');
const evaluationLogPath = join(
  process.cwd(),
  'logs',
  `adversarial-rag-evaluation-${evaluationTimestamp}.log`,
);

function writeEvaluationLog(message: string): void {
  mkdirSync(dirname(evaluationLogPath), { recursive: true });
  appendFileSync(evaluationLogPath, `${message}\n\n`, 'utf8');
}

function formatList(items: string[]): string[] {
  return items.length > 0
    ? items.map((item) => `    - ${item}`)
    : ['    - None'];
}

function formatEvaluationReport(
  results: AdversarialRagEvaluationResult[],
  startedAt: Date,
  durationMs: number,
): string {
  const failedCount = results.filter(({ passed }) => !passed).length;
  const passedCount = results.length - failedCount;
  const lines = [
    '='.repeat(72),
    'ADVERSARIAL RAG EVALUATION',
    `Run at:   ${startedAt.toISOString()}`,
    `Duration: ${durationMs} ms`,
    'Responses are not logged to avoid persisting potentially leaked content.',
    '='.repeat(72),
  ];

  results.forEach((result, index) => {
    const evaluationCase = ADVERSARIAL_RAG_EVALUATION_CASES.find(
      ({ id }) => id === result.id,
    );

    lines.push(
      '',
      `[${result.passed ? 'PASS' : 'FAIL'}] ${index + 1}/${results.length} - ${result.id}`,
      `  Query: ${getLatestUserMessage(evaluationCase)}`,
      `  Required facts matched: ${result.missingRequiredFacts.length === 0 ? 'Yes' : 'No'}`,
      `  Forbidden text absent: ${result.matchedForbiddenText.length === 0 ? 'Yes' : 'No'}`,
      `  Reply expectation matched: ${result.replyMatched ? 'Yes' : 'No'}`,
      `  Sources matched: ${result.sourcesMatched ? 'Yes' : 'No'}`,
      '  Returned sources:',
      ...formatList(result.retrievedSources),
    );

    if (!result.passed) {
      lines.push(
        '  Missing required facts:',
        ...formatList(result.missingRequiredFacts),
        '  Matched forbidden text:',
        ...formatList(result.matchedForbiddenText),
      );
    }
  });

  lines.push(
    '',
    '-'.repeat(72),
    'SUMMARY',
    `  Result: ${failedCount === 0 ? 'PASS' : 'FAIL'}`,
    `  Passed: ${passedCount}`,
    `  Failed: ${failedCount}`,
    `  Total:  ${results.length}`,
    `  Log:    ${evaluationLogPath}`,
    '='.repeat(72),
  );

  return lines.join('\n');
}

function getLatestUserMessage(
  evaluationCase: AdversarialRagEvaluationCase | undefined,
): string {
  return (
    [...(evaluationCase?.messages ?? [])]
      .reverse()
      .find(({ role }) => role === 'user')?.content ?? 'Unknown'
  );
}

async function runEvaluation(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const aiApiService = application.get(AiApiService);
    const results = await evaluateAdversarialRag(async (evaluationCase) => {
      const retrievalService: Pick<KnowledgeBaseRetrievalService, 'retrieve'> =
        {
          retrieve: async () => evaluationCase.retrievedChunks,
        };
      const chatService = new ChatService(
        aiApiService,
        retrievalService as KnowledgeBaseRetrievalService,
      );

      return chatService.processMessage(evaluationCase.messages);
    }, ADVERSARIAL_RAG_EVALUATION_CASES);
    const report = formatEvaluationReport(
      results,
      evaluationStartedAt,
      Date.now() - evaluationStartedAt.getTime(),
    );
    const failedCount = results.filter(({ passed }) => !passed).length;

    writeEvaluationLog(report);
    process.stdout.write(`${report}\n`);

    if (failedCount > 0) {
      process.exitCode = 1;
    }
  } finally {
    await application.close();
  }
}

runEvaluation().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown evaluation failure';
  const report = [
    '='.repeat(72),
    'ADVERSARIAL RAG EVALUATION',
    `Run at: ${evaluationStartedAt.toISOString()}`,
    'Result: ERROR',
    '-'.repeat(72),
    message,
    '='.repeat(72),
  ].join('\n');

  writeEvaluationLog(report);
  process.stderr.write(`${report}\n`);
  process.exitCode = 1;
});
