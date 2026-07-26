export abstract class EmbeddingService {
  abstract getDimensions(): number;

  abstract generateEmbeddings(input: string[]): Promise<number[][]>;
}
