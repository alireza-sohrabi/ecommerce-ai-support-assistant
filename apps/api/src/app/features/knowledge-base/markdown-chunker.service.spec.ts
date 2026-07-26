import { BadRequestException } from '@nestjs/common';
import { MarkdownChunkerService } from './markdown-chunker.service';

describe('MarkdownChunkerService', () => {
  const chunker = new MarkdownChunkerService();

  it('creates metadata-rich chunks while preserving nested Markdown', () => {
    const chunks = chunker.chunk({
      sourcePath: 'policies\\shipping.md',
      content: [
        '# Shipping Policy\r',
        '\r',
        'Introductory text.\r',
        '\r',
        '## Delivery options\r',
        '\r',
        '| Service | Time |\r',
        '| --- | --- |\r',
        '| Standard | 3 days |\r',
        '\r',
        '### Exceptions\r',
        '\r',
        '- Remote areas take longer.\r',
        '\r',
        '## Empty section\r',
        '\r',
      ].join('\n'),
    });

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toMatchObject({
      sourcePath: 'policies/shipping.md',
      category: 'policies',
      documentTitle: 'Shipping Policy',
      sectionTitle: 'Overview',
      sectionIndex: 0,
      content: 'Introductory text.',
    });
    expect(chunks[1]).toMatchObject({
      sectionTitle: 'Delivery options',
      sectionIndex: 1,
      content: [
        '| Service | Time |',
        '| --- | --- |',
        '| Standard | 3 days |',
        '',
        '### Exceptions',
        '',
        '- Remote areas take longer.',
      ].join('\n'),
    });
    expect(chunks[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(chunks[0].contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('keeps identity stable while changing the content hash', () => {
    const original = chunker.chunk({
      sourcePath: 'guides/order-tracking.md',
      content: '# Order tracking\n\n## Status\n\nOriginal body.',
    })[0];
    const updated = chunker.chunk({
      sourcePath: 'guides/order-tracking.md',
      content: '# Order tracking\n\n## Status\n\nUpdated body.',
    })[0];

    expect(updated.id).toBe(original.id);
    expect(updated.contentHash).not.toBe(original.contentHash);
  });

  it('detects document-title changes without changing section identity', () => {
    const original = chunker.chunk({
      sourcePath: 'guides/order-tracking.md',
      content: '# Order tracking\n\n## Status\n\nOrder status.',
    })[0];
    const renamed = chunker.chunk({
      sourcePath: 'guides/order-tracking.md',
      content: '# Track an order\n\n## Status\n\nOrder status.',
    })[0];

    expect(renamed.id).toBe(original.id);
    expect(renamed.contentHash).not.toBe(original.contentHash);
  });

  it('keeps identity stable when a preceding section is inserted', () => {
    const original = chunker.chunk({
      sourcePath: 'guides/order-tracking.md',
      content: '# Order tracking\n\n## Status\n\nOrder status.',
    })[0];
    const withEarlierSection = chunker.chunk({
      sourcePath: 'guides/order-tracking.md',
      content: [
        '# Order tracking',
        '',
        '## Introduction',
        '',
        'Introduction.',
        '',
        '## Status',
        '',
        'Order status.',
      ].join('\n'),
    })[1];

    expect(withEarlierSection.sectionIndex).toBe(1);
    expect(withEarlierSection.id).toBe(original.id);
  });

  it('rejects duplicate section headings', () => {
    expect(() =>
      chunker.chunk({
        sourcePath: 'faqs/products.md',
        content: [
          '# Products',
          '',
          '## Availability',
          '',
          'First answer.',
          '',
          '## Availability',
          '',
          'Second answer.',
        ].join('\n'),
      }),
    ).toThrow(
      new BadRequestException(
        'Knowledge-base document "faqs/products.md" has duplicate section heading "Availability".',
      ),
    );
  });

  it('rejects documents without an H1 title', () => {
    expect(() =>
      chunker.chunk({
        sourcePath: 'policies/invalid.md',
        content: '## Section\n\nBody',
      }),
    ).toThrow(
      new BadRequestException(
        'Knowledge-base document "policies/invalid.md" must have an H1 title.',
      ),
    );
  });

  it('rejects documents without any non-empty section content', () => {
    expect(() =>
      chunker.chunk({
        sourcePath: 'policies/empty.md',
        content: '# Empty policy\n\n## Empty section\n',
      }),
    ).toThrow(
      new BadRequestException(
        'Knowledge-base document "policies/empty.md" must have at least one non-empty section.',
      ),
    );
  });
});
