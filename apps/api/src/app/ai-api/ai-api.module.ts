import { Module } from '@nestjs/common';
import {
  OpenAIModule,
  OpenAIService,
} from '@api/integrations/openai';
import { AiApiService } from './ai-api.service';

@Module({
  imports: [OpenAIModule],
  providers: [
    {
      provide: AiApiService,
      useExisting: OpenAIService,
    },
  ],
  exports: [AiApiService],
})
export class AiApiModule {}
