import { Test } from '@nestjs/testing';
import { OpenAIService } from '@api/integrations/openai';
import { OPENAI_CLIENT } from '../integrations/openai/openai-client.constant';
import { AiApiModule } from './ai-api.module';
import { AiApiService } from './ai-api.service';

describe('AiApiModule', () => {
  it('exposes OpenAI through the AI API abstraction', async () => {
    const openAIService = {
      generateResponse: jest.fn(),
    };
    const module = await Test.createTestingModule({
      imports: [AiApiModule],
    })
      .overrideProvider(OPENAI_CLIENT)
      .useValue({})
      .overrideProvider(OpenAIService)
      .useValue(openAIService)
      .compile();

    expect(module.get(AiApiService)).toBe(openAIService);
  });
});
