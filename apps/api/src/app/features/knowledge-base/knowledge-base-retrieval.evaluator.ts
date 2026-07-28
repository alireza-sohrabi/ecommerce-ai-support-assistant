import type { KnowledgeBaseRetrievalService } from './knowledge-base-retrieval.service';
import type { KnowledgeBaseRetrievalEvaluationCase } from './knowledge-base-retrieval.evaluation-cases';

export interface KnowledgeBaseRetrievalEvaluationResult {
  id: string;
  missingSections: string[];
  passed: boolean;
  retrievedSections: string[];
}

export async function evaluateKnowledgeBaseRetrieval(
  retrievalService: Pick<KnowledgeBaseRetrievalService, 'retrieve'>,
  evaluationCases: KnowledgeBaseRetrievalEvaluationCase[],
): Promise<KnowledgeBaseRetrievalEvaluationResult[]> {
  const results: KnowledgeBaseRetrievalEvaluationResult[] = [];

  for (const evaluationCase of evaluationCases) {
    const retrievedChunks = await retrievalService.retrieve(
      evaluationCase.query,
    );
    const retrievedSections = retrievedChunks.map(
      ({ documentTitle, sectionTitle }) =>
        formatSection(documentTitle, sectionTitle),
    );
    const expectedSections = evaluationCase.expectedSections.map(
      ({ documentTitle, sectionTitle }) =>
        formatSection(documentTitle, sectionTitle),
    );
    const missingSections = expectedSections.filter(
      (section) => !retrievedSections.includes(section),
    );
    const expectsNoResults = expectedSections.length === 0;
    const passed = expectsNoResults
      ? retrievedSections.length === 0
      : missingSections.length === 0;

    results.push({
      id: evaluationCase.id,
      missingSections,
      passed,
      retrievedSections,
    });
  }

  return results;
}

function formatSection(documentTitle: string, sectionTitle: string): string {
  return `${documentTitle} / ${sectionTitle}`;
}
