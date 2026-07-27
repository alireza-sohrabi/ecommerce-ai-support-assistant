export interface StoredVectorPoint {
  contentHash?: string;
  id: number | string;
}

export interface VectorPoint {
  id: string;
  payload: Record<string, boolean | number | string>;
  vector: number[];
}

export interface VectorSearchResult {
  id: number | string;
  payload: Record<string, unknown>;
  score: number;
}

export abstract class VectorDatabaseService {
  abstract listCollections(): Promise<string[]>;

  abstract ensureCollection(
    collectionName: string,
    vectorSize: number,
  ): Promise<void>;

  abstract listPoints(collectionName: string): Promise<StoredVectorPoint[]>;

  abstract upsertPoints(
    collectionName: string,
    points: VectorPoint[],
  ): Promise<void>;

  abstract deletePoints(
    collectionName: string,
    pointIds: Array<number | string>,
  ): Promise<void>;

  abstract search(
    collectionName: string,
    vector: number[],
    limit: number,
    scoreThreshold: number,
  ): Promise<VectorSearchResult[]>;
}
