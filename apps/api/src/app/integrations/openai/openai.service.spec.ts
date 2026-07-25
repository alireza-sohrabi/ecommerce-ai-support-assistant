import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { OPENAI_CLIENT } from './openai-client.constant';
import { OpenAIService } from './openai.service';

describe('OpenAIService', () => {
  let service: OpenAIService;
  let testingModule: TestingModule;

  const createResponseMock = jest.fn();
  const getOrThrowMock = jest.fn();

  beforeEach(async () => {
    createResponseMock.mockResolvedValue({
      output_text: 'Your order is being processed.',
    });
    getOrThrowMock.mockReturnValue('gpt-5.6-luna');

    testingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        {
          provide: OPENAI_CLIENT,
          useValue: {
            responses: {
              create: createResponseMock,
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: getOrThrowMock,
          },
        },
      ],
    }).compile();

    service = testingModule.get(OpenAIService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    await testingModule.close();
  });

  it('translates a generic request into an OpenAI response request', async () => {
    const messages = [
      {
        content: 'Where is my order?',
        role: 'user' as const,
      },
      {
        content: 'What is your order number?',
        role: 'assistant' as const,
      },
      {
        content: 'ORDER-123',
        role: 'user' as const,
      },
    ];
    const reply = await service.generateResponse({
      input: messages,
      instructions: 'Be helpful.',
      maxOutputTokens: 300,
    });

    expect(getOrThrowMock).toHaveBeenCalledWith('OPENAI_MODEL');
    expect(createResponseMock).toHaveBeenCalledWith({
      model: 'gpt-5.6-luna',
      input: messages,
      instructions: 'Be helpful.',
      max_output_tokens: 300,
    });
    expect(reply).toBe('Your order is being processed.');
  });

  it('returns a safe error when OpenAI is unavailable', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    createResponseMock.mockRejectedValueOnce(new Error('OpenAI unavailable'));

    await expect(
      service.generateResponse({ input: 'Where is my order?' }),
    ).rejects.toThrow(
      new ServiceUnavailableException(
        'AI service is temporarily unavailable. Please try again later.',
      ),
    );
  });
});
