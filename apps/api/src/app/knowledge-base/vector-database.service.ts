export abstract class VectorDatabaseService {
  abstract listCollections(): Promise<string[]>;
}
