import { InternalServerErrorException } from '@nestjs/common';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MarkdownDocumentLoader } from './markdown-document-loader.service';

describe('MarkdownDocumentLoader', () => {
  let temporaryRoot: string;

  beforeEach(async () => {
    temporaryRoot = await mkdtemp(
      path.join(tmpdir(), 'knowledge-document-loader-'),
    );
  });

  afterEach(async () => {
    const resolvedTemporaryRoot = path.resolve(temporaryRoot);
    const resolvedSystemTemp = path.resolve(tmpdir());

    if (resolvedTemporaryRoot.startsWith(`${resolvedSystemTemp}${path.sep}`)) {
      await rm(resolvedTemporaryRoot, {
        recursive: true,
        force: true,
      });
    }
  });

  it('recursively loads Markdown documents in deterministic path order', async () => {
    await mkdir(path.join(temporaryRoot, 'policies'));
    await mkdir(path.join(temporaryRoot, 'faqs'));
    await writeFile(
      path.join(temporaryRoot, 'policies', 'shipping.MD'),
      '# Shipping',
    );
    await writeFile(
      path.join(temporaryRoot, 'faqs', 'products.md'),
      '# Products',
    );
    await writeFile(
      path.join(temporaryRoot, 'faqs', 'ignored.txt'),
      'Not Markdown',
    );

    const loader = new MarkdownDocumentLoader(temporaryRoot);

    await expect(loader.loadDocuments()).resolves.toEqual([
      {
        sourcePath: 'faqs/products.md',
        content: '# Products',
      },
      {
        sourcePath: 'policies/shipping.MD',
        content: '# Shipping',
      },
    ]);
  });

  it('ignores symbolic links', async () => {
    const targetPath = path.join(temporaryRoot, 'target.md');
    const linkPath = path.join(temporaryRoot, 'linked.md');
    await writeFile(targetPath, '# Target');

    try {
      await symlink(targetPath, linkPath, 'file');
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'EPERM'
      ) {
        return;
      }

      throw error;
    }

    const loader = new MarkdownDocumentLoader(temporaryRoot);

    await expect(loader.loadDocuments()).resolves.toEqual([
      {
        sourcePath: 'target.md',
        content: '# Target',
      },
    ]);
  });

  it('rejects oversized documents without exposing their path', async () => {
    const oversizedPath = path.join(temporaryRoot, 'secret-document.md');
    await writeFile(oversizedPath, Buffer.alloc(256 * 1024 + 1));
    const loader = new MarkdownDocumentLoader(temporaryRoot);

    await expect(loader.loadDocuments()).rejects.toThrow(
      new InternalServerErrorException(
        'Knowledge-base document exceeds the 262144-byte limit.',
      ),
    );
  });

  it('returns a safe error when the root cannot be read', async () => {
    const loader = new MarkdownDocumentLoader(
      path.join(temporaryRoot, 'missing'),
    );

    await expect(loader.loadDocuments()).rejects.toThrow(
      new InternalServerErrorException('Unable to load the knowledge base.'),
    );
  });
});
