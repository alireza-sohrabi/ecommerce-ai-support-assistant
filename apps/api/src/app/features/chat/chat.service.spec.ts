import { Test, TestingModule } from '@nestjs/testing';
import { AiApiService } from '@api/ports/ai-api/ai-api.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let testingModule: TestingModule;

  const generateResponseMock = jest.fn();

  beforeEach(async () => {
    generateResponseMock.mockResolvedValue('Your order is being processed.');

    testingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: AiApiService,
          useValue: {
            generateResponse: generateResponseMock,
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

  it('should return the generated reply from the AI API', async () => {
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

    expect(generateResponseMock).toHaveBeenCalledWith({
      input: messages,
      instructions:
        'You are a concise and helpful ecommerce customer support assistant.',
      maxOutputTokens: 300,
    });
    expect(reply).toBe('Your order is being processed.');
  });

  it('should propagate errors from the AI API', async () => {
    const error = new Error('AI API unavailable');
    generateResponseMock.mockRejectedValueOnce(error);

    await expect(
      service.processMessage([
        {
          content: 'Where is my order?',
          role: 'user',
        },
      ]),
    ).rejects.toBe(error);
  });
});
