import type { RetrievedKnowledgeChunk } from './knowledge-base-retrieval.service';
import {
  evaluateKnowledgeBaseRetrieval,
  type KnowledgeBaseRetrievalEvaluationResult,
} from './knowledge-base-retrieval.evaluator';

describe('evaluateKnowledgeBaseRetrieval', () => {
  it('passes supported and unsupported retrieval expectations', async () => {
    const retrieve = jest
      .fn()
      .mockResolvedValueOnce([
        createRetrievedChunk('Refund Policy', 'Refund method and timing'),
      ])
      .mockResolvedValueOnce([]);

    await expect(
      evaluateKnowledgeBaseRetrieval({ retrieve }, [
        {
          id: 'supported',
          query: 'How long do refunds take?',
          expectedSections: [
            {
              documentTitle: 'Refund Policy',
              sectionTitle: 'Refund method and timing',
            },
          ],
        },
        {
          id: 'unsupported',
          query: 'Can I pay with Bitcoin?',
          expectedSections: [],
        },
      ]),
    ).resolves.toEqual<KnowledgeBaseRetrievalEvaluationResult[]>([
      {
        id: 'supported',
        missingSections: [],
        passed: true,
        retrievedSections: ['Refund Policy / Refund method and timing'],
      },
      {
        id: 'unsupported',
        missingSections: [],
        passed: true,
        retrievedSections: [],
      },
    ]);
  });

  it('reports missing expected sections and unexpected unsupported results', async () => {
    const retrieve = jest
      .fn()
      .mockResolvedValueOnce([
        createRetrievedChunk('Refund Policy', 'Overview'),
      ])
      .mockResolvedValueOnce([
        createRetrievedChunk('Shipping Policy', 'Delivery options'),
      ]);

    await expect(
      evaluateKnowledgeBaseRetrieval({ retrieve }, [
        {
          id: 'missing-section',
          query: 'How long do refunds take?',
          expectedSections: [
            {
              documentTitle: 'Refund Policy',
              sectionTitle: 'Refund method and timing',
            },
          ],
        },
        {
          id: 'unexpected-result',
          query: 'Can I pay with Bitcoin?',
          expectedSections: [],
        },
      ]),
    ).resolves.toEqual([
      {
        id: 'missing-section',
        missingSections: ['Refund Policy / Refund method and timing'],
        passed: false,
        retrievedSections: ['Refund Policy / Overview'],
      },
      {
        id: 'unexpected-result',
        missingSections: [],
        passed: false,
        retrievedSections: ['Shipping Policy / Delivery options'],
      },
    ]);
  });
});

function createRetrievedChunk(
  documentTitle: string,
  sectionTitle: string,
): RetrievedKnowledgeChunk {
  return {
    id: `${documentTitle}-${sectionTitle}`,
    sourcePath: 'policies/example.md',
    category: 'policies',
    documentTitle,
    sectionTitle,
    sectionIndex: 0,
    content: 'Evaluation content.',
    contentHash: 'evaluation-hash',
    score: 0.5,
  };
}
