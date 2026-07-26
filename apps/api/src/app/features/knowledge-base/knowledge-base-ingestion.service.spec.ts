import path from 'node:path';
import { KnowledgeBaseIngestionService } from './knowledge-base-ingestion.service';
import { MarkdownChunkerService } from './markdown-chunker.service';
import { MarkdownDocumentLoader } from './markdown-document-loader.service';

describe('KnowledgeBaseIngestionService', () => {
  it('prepares stable, unique chunks from all source documents', async () => {
    const knowledgeBaseRoot = path.resolve(
      __dirname,
      '../../../../content/knowledge-base',
    );
    const loader = new MarkdownDocumentLoader(knowledgeBaseRoot);
    const service = new KnowledgeBaseIngestionService(
      loader,
      new MarkdownChunkerService(),
    );

    const firstResult = await service.prepareChunks();
    const secondResult = await service.prepareChunks();
    const sourcePaths = new Set(
      firstResult.map(({ sourcePath }) => sourcePath),
    );
    const ids = firstResult.map(({ id }) => id);

    expect(sourcePaths).toEqual(
      new Set([
        'faqs/products.md',
        'guides/order-tracking.md',
        'policies/refunds.md',
        'policies/returns.md',
        'policies/shipping.md',
      ]),
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(secondResult).toEqual(firstResult);
    expect(firstResult).toEqual(
      [...firstResult].sort(
        (left, right) =>
          left.sourcePath.localeCompare(right.sourcePath) ||
          left.sectionIndex - right.sectionIndex,
      ),
    );
  });

  it('does not require AI or vector-database dependencies', async () => {
    const loader = {
      loadDocuments: jest.fn().mockResolvedValue([
        {
          sourcePath: 'policies/example.md',
          content: '# Example\n\n## Rule\n\nExample rule.',
        },
      ]),
    };
    const chunker = {
      chunk: jest.fn().mockReturnValue([{ id: 'chunk-id' }]),
    };
    const service = new KnowledgeBaseIngestionService(
      loader as unknown as MarkdownDocumentLoader,
      chunker as unknown as MarkdownChunkerService,
    );

    await expect(service.prepareChunks()).resolves.toEqual([
      { id: 'chunk-id' },
    ]);
    expect(loader.loadDocuments).toHaveBeenCalledTimes(1);
    expect(chunker.chunk).toHaveBeenCalledWith({
      sourcePath: 'policies/example.md',
      content: '# Example\n\n## Rule\n\nExample rule.',
    });
  });
});
