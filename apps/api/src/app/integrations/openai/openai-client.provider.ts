import { FactoryProvider } from '@nestjs/common';
import OpenAI from 'openai';
import { OPENAI_CLIENT } from './openai-client.constant';
import { ConfigService } from '@nestjs/config';
import { readRequiredString } from '@api/shared/utils/configuration.util';

export const openAIClientProvider: FactoryProvider<OpenAI> = {
  provide: OPENAI_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const apiKey = readRequiredString(configService, 'OPENAI_API_KEY');

    return new OpenAI({ apiKey });
  },
};
