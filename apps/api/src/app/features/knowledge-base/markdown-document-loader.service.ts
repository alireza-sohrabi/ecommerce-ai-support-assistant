import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { KNOWLEDGE_BASE_ROOT } from './knowledge-base-root.constant';

export interface MarkdownDocument {
  sourcePath: string;
  content: string;
}

const MAX_DOCUMENT_SIZE_BYTES = 256 * 1024;

@Injectable()
export class MarkdownDocumentLoader {
  private readonly rootDirectory: string;

  constructor(
    @Inject(KNOWLEDGE_BASE_ROOT)
    rootDirectory: string,
  ) {
    this.rootDirectory = path.resolve(rootDirectory);
  }

  async loadDocuments(): Promise<MarkdownDocument[]> {
    try {
      const filePaths = await this.discoverMarkdownFiles(this.rootDirectory);
      const documents = await Promise.all(
        filePaths.map((filePath) => this.loadDocument(filePath)),
      );

      return documents.sort((left, right) =>
        left.sourcePath.localeCompare(right.sourcePath),
      );
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Unable to load the knowledge base.',
      );
    }
  }

  private async discoverMarkdownFiles(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const discoveredFiles = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(directory, entry.name);

        if (entry.isSymbolicLink()) {
          return [];
        }

        if (entry.isDirectory()) {
          return this.discoverMarkdownFiles(entryPath);
        }

        if (
          entry.isFile() &&
          path.extname(entry.name).toLowerCase() === '.md'
        ) {
          return [entryPath];
        }

        return [];
      }),
    );

    return discoveredFiles.flat();
  }

  private async loadDocument(filePath: string): Promise<MarkdownDocument> {
    const fileStats = await stat(filePath);

    if (fileStats.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new InternalServerErrorException(
        `Knowledge-base document exceeds the ${MAX_DOCUMENT_SIZE_BYTES}-byte limit.`,
      );
    }

    return {
      sourcePath: path
        .relative(this.rootDirectory, filePath)
        .split(path.sep)
        .join('/'),
      content: await readFile(filePath, 'utf8'),
    };
  }
}
