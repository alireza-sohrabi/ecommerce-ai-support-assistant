import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChatRequestDto } from './chat-request.dto';

describe('ChatRequestDto', () => {
  it('should accept and trim valid conversation messages', async () => {
    const dto = plainToInstance(ChatRequestDto, {
      messages: [
        { role: 'user', content: '  Where is my order?  ' },
        { role: 'assistant', content: ' What is your order number? ' },
      ],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.messages).toEqual([
      { role: 'user', content: 'Where is my order?' },
      { role: 'assistant', content: 'What is your order number?' },
    ]);
  });

  it('should reject an empty conversation', async () => {
    const dto = plainToInstance(ChatRequestDto, { messages: [] });

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toHaveProperty('arrayMinSize');
  });

  it('should reject more than 10 messages', async () => {
    const dto = plainToInstance(ChatRequestDto, {
      messages: Array.from({ length: 11 }, () => ({
        role: 'user',
        content: 'Hello',
      })),
    });

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toHaveProperty('arrayMaxSize');
  });

  it.each([
    ['an unsupported role', { role: 'developer', content: 'Hello' }, 'isIn'],
    ['empty content', { role: 'user', content: '   ' }, 'isNotEmpty'],
    ['non-string content', { role: 'user', content: 42 }, 'isString'],
    [
      'content longer than 2,000 characters',
      { role: 'user', content: 'a'.repeat(2001) },
      'maxLength',
    ],
  ])('should reject %s', async (_description, message, constraint) => {
    const dto = plainToInstance(ChatRequestDto, { messages: [message] });

    const errors = await validate(dto);
    const childConstraints = errors[0]?.children?.[0]?.children?.[0]?.constraints;

    expect(childConstraints).toHaveProperty(constraint);
  });
});
