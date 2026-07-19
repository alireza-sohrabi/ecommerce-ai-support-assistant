import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChatRequestDto } from './chat-request.dto';

describe('ChatRequestDto', () => {
  it('should accept and trim a valid message', async () => {
    const dto = plainToInstance(ChatRequestDto, {
      message: '  Where is my order?  ',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.message).toBe('Where is my order?');
  });

  it('should reject a whitespace-only message', async () => {
    const dto = plainToInstance(ChatRequestDto, { message: '   ' });

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toHaveProperty('isNotEmpty');
  });

  it('should reject a non-string message', async () => {
    const dto = plainToInstance(ChatRequestDto, { message: 42 });

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toHaveProperty('isString');
  });

  it('should reject a message longer than 2,000 characters', async () => {
    const dto = plainToInstance(ChatRequestDto, { message: 'a'.repeat(2001) });

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toHaveProperty('maxLength');
  });
});
