import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    example: '1',
  })
  agentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'What is the capital of France?',
  })
  question: string;

  @ApiProperty({
    required: false,
    example: '67a1e4ff866659edf828f617',
  })
  @IsString()
  @IsOptional()
  threadId: string;
}
