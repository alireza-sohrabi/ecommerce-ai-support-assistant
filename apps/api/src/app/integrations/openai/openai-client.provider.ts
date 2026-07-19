import { FactoryProvider } from '@nestjs/common';
import OpenAI from 'openai';
import { OPENAI_CLIENT } from './openai-client.constant';
import { ConfigService } from '@nestjs/config';

export const openAIClientProvider: FactoryProvider<OpenAI> = {
  provide: OPENAI_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const apiKey = configService.getOrThrow<string>('OPENAI_API_KEY');

    return new OpenAI({ apiKey });
  },
};
