import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  agentId: string;

  @ApiProperty({
    example: 'What is the capital of France?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    required: false,
    example: '67a1e4ff866659edf828f617',
  })
  @IsString()
  @IsOptional()
  threadId: string;
}
