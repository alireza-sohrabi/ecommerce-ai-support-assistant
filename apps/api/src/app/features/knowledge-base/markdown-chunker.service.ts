import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import {
  createKnowledgeChunkEmbeddingInput,
  type KnowledgeChunk,
} from './knowledge-chunk';
import type { MarkdownDocument } from './markdown-document-loader.service';

interface ParsedSection {
  title: string;
  content: string;
}

@Injectable()
export class MarkdownChunkerService {
  chunk(document: MarkdownDocument): KnowledgeChunk[] {
    const normalizedSourcePath = document.sourcePath.replace(/\\/g, '/');
    const lines = this.normalizeContent(document.content).split('\n');
    const titleIndex = lines.findIndex((line) => /^#\s+(.+?)\s*$/.test(line));

    if (titleIndex === -1) {
      throw new BadRequestException(
        `Knowledge-base document "${normalizedSourcePath}" must have an H1 title.`,
      );
    }

    const documentTitle = this.extractHeading(lines[titleIndex], 1);
    const sections = this.parseSections(lines.slice(titleIndex + 1));

    if (sections.length === 0) {
      throw new BadRequestException(
        `Knowledge-base document "${normalizedSourcePath}" must have at least one non-empty section.`,
      );
    }

    this.assertUniqueSectionTitles(sections, normalizedSourcePath);
    const category = normalizedSourcePath.split('/')[0] || 'uncategorized';

    return sections.map((section, sectionIndex) => {
      const identity = [normalizedSourcePath, section.title].join('\0');
      const chunkContent = {
        documentTitle,
        sectionTitle: section.title,
        content: section.content,
      };

      return {
        id: this.deterministicUuid(identity),
        sourcePath: normalizedSourcePath,
        category,
        documentTitle,
        sectionTitle: section.title,
        sectionIndex,
        content: section.content,
        contentHash: this.sha256(
          createKnowledgeChunkEmbeddingInput(chunkContent),
        ),
      };
    });
  }

  private parseSections(lines: string[]): ParsedSection[] {
    const sections: ParsedSection[] = [];
    let currentTitle = 'Overview';
    let currentLines: string[] = [];

    const flushSection = () => {
      const content = currentLines.join('\n').trim();

      if (content) {
        sections.push({
          title: currentTitle,
          content,
        });
      }
    };

    for (const line of lines) {
      if (/^##\s+(.+?)\s*$/.test(line)) {
        flushSection();
        currentTitle = this.extractHeading(line, 2);
        currentLines = [];
        continue;
      }

      currentLines.push(line);
    }

    flushSection();

    return sections;
  }

  private assertUniqueSectionTitles(
    sections: ParsedSection[],
    sourcePath: string,
  ): void {
    const seenTitles = new Set<string>();

    for (const section of sections) {
      if (seenTitles.has(section.title)) {
        throw new BadRequestException(
          `Knowledge-base document "${sourcePath}" has duplicate section heading "${section.title}".`,
        );
      }

      seenTitles.add(section.title);
    }
  }

  private normalizeContent(content: string): string {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  private extractHeading(line: string, level: 1 | 2): string {
    return line.slice(level).trim();
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
  }

  private deterministicUuid(value: string): string {
    const bytes = createHash('sha256')
      .update(value, 'utf8')
      .digest()
      .subarray(0, 16);

    bytes[6] = (bytes[6] & 0x0f) | 0x50;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = bytes.toString('hex');

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join('-');
  }
}
