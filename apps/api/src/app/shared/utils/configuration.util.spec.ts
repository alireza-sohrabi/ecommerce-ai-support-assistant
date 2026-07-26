import { ConfigService } from '@nestjs/config';
import { readPositiveInteger, readRequiredString } from './configuration.util';

describe('configuration utilities', () => {
  it('reads and trims a required string', () => {
    const configService = createConfigService({
      REQUIRED_VALUE: '  configured value  ',
    });

    expect(readRequiredString(configService, 'REQUIRED_VALUE')).toBe(
      'configured value',
    );
  });

  it('rejects an empty required string', () => {
    const configService = createConfigService({
      REQUIRED_VALUE: '   ',
    });

    expect(() => readRequiredString(configService, 'REQUIRED_VALUE')).toThrow(
      'REQUIRED_VALUE must not be empty',
    );
  });

  it('reads a positive integer', () => {
    const configService = createConfigService({
      VECTOR_SIZE: '1536',
    });

    expect(readPositiveInteger(configService, 'VECTOR_SIZE')).toBe(1536);
  });

  it.each(['0', '-1', '1.5', 'not-a-number'])(
    'rejects invalid positive integer %s',
    (configuredValue) => {
      const configService = createConfigService({
        VECTOR_SIZE: configuredValue,
      });

      expect(() => readPositiveInteger(configService, 'VECTOR_SIZE')).toThrow(
        'VECTOR_SIZE must be a positive integer',
      );
    },
  );
});

function createConfigService(
  configuration: Record<string, string>,
): ConfigService {
  return {
    getOrThrow: jest.fn((key: string) => {
      if (!(key in configuration)) {
        throw new Error(`Missing ${key}`);
      }

      return configuration[key];
    }),
  } as unknown as ConfigService;
}
