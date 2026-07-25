import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { OPENAI_CLIENT } from '@api/integrations/openai';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
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
        ChatService,
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

    service = testingModule.get<ChatService>(ChatService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    await testingModule.close();
  });

  it('should return the generated reply using the configured model', async () => {
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
    const reply = await service.processMessage(messages);

    expect(getOrThrowMock).toHaveBeenCalledWith('OPENAI_MODEL');
    expect(createResponseMock).toHaveBeenCalledWith({
      model: 'gpt-5.6-luna',
      input: messages,
      instructions:
        'You are a concise and helpful ecommerce customer support assistant.',
      max_output_tokens: 300,
    });
    expect(reply).toBe('Your order is being processed.');
  });

  it('should throw ServiceUnavailableException when OpenAI fails', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    createResponseMock.mockRejectedValueOnce(new Error('OpenAI unavailable'));

    await expect(
      service.processMessage([
        {
          content: 'Where is my order?',
          role: 'user',
        },
      ]),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
