export interface KnowledgeChunk {
  id: string;
  sourcePath: string;
  category: string;
  documentTitle: string;
  sectionTitle: string;
  sectionIndex: number;
  content: string;
  contentHash: string;
}

export function createKnowledgeChunkEmbeddingInput(
  chunk: Pick<KnowledgeChunk, 'content' | 'documentTitle' | 'sectionTitle'>,
): string {
  return [
    `# ${chunk.documentTitle}`,
    `## ${chunk.sectionTitle}`,
    chunk.content,
  ].join('\n\n');
}
