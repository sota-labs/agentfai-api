import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class AgentWebhookTriggerDto {
  @IsString()
  @ApiProperty({
    description: 'The answer from the AI agent',
    example: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  })
  answer: string;

  @IsString()
  @ApiProperty({ description: 'The message ID', example: '66b1b1b1b1b1b1b1b1b1b1b1' })
  messageId: string;
}
