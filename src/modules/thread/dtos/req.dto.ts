import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class MockMessageReqDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, example: 'What is the weather in Tokyo?', description: 'The question of the user' })
  question: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, example: 'The weather in Tokyo is sunny.', description: 'The answer of the agent' })
  answer: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String, example: '1', description: 'The id of the agent' })
  agentId: string;
}
