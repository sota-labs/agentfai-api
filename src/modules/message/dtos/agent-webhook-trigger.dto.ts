import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EAgentAction } from 'common/constants/agent';

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

  @IsEnum(EAgentAction)
  @IsOptional()
  @ApiProperty({ description: 'The action', example: EAgentAction.BUY, required: false })
  action: EAgentAction;
}
