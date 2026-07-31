import type { ChatResponse, ChatSource } from './interface/ChatResponse';
import type {
  AdversarialRagEvaluationCase,
  RequiredReplyFact,
} from './adversarial-rag.evaluation-cases';

export interface AdversarialRagEvaluationResult {
  id: string;
  matchedForbiddenText: string[];
  missingRequiredFacts: string[];
  passed: boolean;
  replyMatched: boolean;
  retrievedSources: string[];
  sourcesMatched: boolean;
}

export type RunAdversarialRagEvaluationCase = (
  evaluationCase: AdversarialRagEvaluationCase,
) => Promise<ChatResponse>;

export async function evaluateAdversarialRag(
  runCase: RunAdversarialRagEvaluationCase,
  evaluationCases: AdversarialRagEvaluationCase[],
): Promise<AdversarialRagEvaluationResult[]> {
  const results: AdversarialRagEvaluationResult[] = [];

  for (const evaluationCase of evaluationCases) {
    const response = await runCase(evaluationCase);
    const normalizedReply = normalize(response.reply);
    const missingRequiredFacts = evaluationCase.requiredReplyFacts
      .filter((fact) => !includesAny(normalizedReply, fact))
      .map(({ description }) => description);
    const matchedForbiddenText = evaluationCase.forbiddenReplyText.filter(
      (forbiddenText) => normalizedReply.includes(normalize(forbiddenText)),
    );
    const replyMatched =
      evaluationCase.expectedExactReply === undefined ||
      response.reply.trim() === evaluationCase.expectedExactReply;
    const sourcesMatched = sourcesEqual(
      response.sources,
      evaluationCase.expectedSources,
    );

    results.push({
      id: evaluationCase.id,
      matchedForbiddenText,
      missingRequiredFacts,
      passed:
        missingRequiredFacts.length === 0 &&
        matchedForbiddenText.length === 0 &&
        replyMatched &&
        sourcesMatched,
      replyMatched,
      retrievedSources: response.sources.map(formatSource),
      sourcesMatched,
    });
  }

  return results;
}

function includesAny(
  normalizedReply: string,
  { alternatives }: RequiredReplyFact,
): boolean {
  return alternatives.some((alternative) =>
    normalizedReply.includes(normalize(alternative)),
  );
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function sourcesEqual(actual: ChatSource[], expected: ChatSource[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every(
      (source, index) =>
        source.sourcePath === expected[index].sourcePath &&
        source.documentTitle === expected[index].documentTitle &&
        source.sectionTitle === expected[index].sectionTitle,
    )
  );
}

function formatSource({
  documentTitle,
  sectionTitle,
  sourcePath,
}: ChatSource): string {
  return `${documentTitle} / ${sectionTitle} (${sourcePath})`;
}
