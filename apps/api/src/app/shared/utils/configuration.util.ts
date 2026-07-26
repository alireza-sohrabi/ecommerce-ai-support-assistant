import { ConfigService } from '@nestjs/config';

export function readRequiredString(
  configService: ConfigService,
  key: string,
): string {
  const value = configService.getOrThrow<string>(key).trim();

  if (!value) {
    throw new Error(`${key} must not be empty`);
  }

  return value;
}

export function readPositiveInteger(
  configService: ConfigService,
  key: string,
): number {
  const value = Number(readRequiredString(configService, key));

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }

  return value;
}
