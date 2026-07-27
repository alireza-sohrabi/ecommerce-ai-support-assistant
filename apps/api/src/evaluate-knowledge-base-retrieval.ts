import 'reflect-metadata';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { KnowledgeBaseRetrievalService } from '@api/features/knowledge-base/knowledge-base-retrieval.service';
import { KNOWLEDGE_BASE_RETRIEVAL_EVALUATION_CASES } from '@api/features/knowledge-base/knowledge-base-retrieval.evaluation-cases';
import { evaluateKnowledgeBaseRetrieval } from '@api/features/knowledge-base/knowledge-base-retrieval.evaluator';
import type { KnowledgeBaseRetrievalEvaluationResult } from '@api/features/knowledge-base/knowledge-base-retrieval.evaluator';

const evaluationStartedAt = new Date();
const evaluationTimestamp = evaluationStartedAt
  .toISOString()
  .replace(/[:.]/g, '-');
const evaluationLogPath = join(
  process.cwd(),
  'logs',
  `knowledge-base-retrieval-evaluation-${evaluationTimestamp}.log`,
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
  results: KnowledgeBaseRetrievalEvaluationResult[],
  startedAt: Date,
  durationMs: number,
): string {
  const failedCount = results.filter(({ passed }) => !passed).length;
  const passedCount = results.length - failedCount;
  const lines = [
    '='.repeat(72),
    'KNOWLEDGE-BASE RETRIEVAL EVALUATION',
    `Run at:   ${startedAt.toISOString()}`,
    `Duration: ${durationMs} ms`,
    '='.repeat(72),
  ];

  results.forEach((result, index) => {
    const evaluationCase = KNOWLEDGE_BASE_RETRIEVAL_EVALUATION_CASES.find(
      ({ id }) => id === result.id,
    );
    const expectedSections =
      evaluationCase?.expectedSections.map(
        ({ documentTitle, sectionTitle }) =>
          `${documentTitle} / ${sectionTitle}`,
      ) ?? [];

    lines.push(
      '',
      `[${result.passed ? 'PASS' : 'FAIL'}] ${index + 1}/${results.length} - ${result.id}`,
      `  Query: ${evaluationCase?.query ?? 'Unknown'}`,
      '  Expected sections:',
      ...formatList(expectedSections),
      '  Retrieved sections:',
      ...formatList(result.retrievedSections),
    );

    if (!result.passed) {
      lines.push(
        '  Missing expected sections:',
        ...formatList(result.missingSections),
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
    '='.repeat(72),
  );

  return lines.join('\n');
}

async function runEvaluation(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const results = await evaluateKnowledgeBaseRetrieval(
      application.get(KnowledgeBaseRetrievalService),
      KNOWLEDGE_BASE_RETRIEVAL_EVALUATION_CASES,
    );

    const failedCount = results.filter(({ passed }) => !passed).length;

    writeEvaluationLog(
      formatEvaluationReport(
        results,
        evaluationStartedAt,
        Date.now() - evaluationStartedAt.getTime(),
      ),
    );

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

  writeEvaluationLog(
    [
      '='.repeat(72),
      'KNOWLEDGE-BASE RETRIEVAL EVALUATION',
      `Run at: ${evaluationStartedAt.toISOString()}`,
      'Result: ERROR',
      '-'.repeat(72),
      message,
      '='.repeat(72),
    ].join('\n'),
  );
  process.exitCode = 1;
});
