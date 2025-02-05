import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { ApiKeyAuth } from 'common/decorators/api-key-auth.decorator';
import { Backend } from 'common/decorators/backend.decorator';
import { AgentWebhookTriggerDto } from 'modules/message/dtos/agent-webhook-trigger.dto';
import { MessageService } from 'modules/message/messgae.service';

@ApiTags('Messages')
@Controller({
  path: '/backend/message',
  version: '1',
})
export class MessageBackendController {
  constructor(private readonly messageService: MessageService) {}

  @Post('agent-webhook-trigger')
  @Backend()
  @ApiKeyAuth()
  @ApiOperation({ summary: 'Webhook trigger an agent' })
  @ApiProperty({ type: AgentWebhookTriggerDto })
  @ApiOkResponse({ schema: { type: 'string', example: 'Ok' } })
  async agentWebhookTrigger(@Body() agentWebhookTriggerDto: AgentWebhookTriggerDto): Promise<string> {
    return this.messageService.agentWebhookTrigger(agentWebhookTriggerDto);
  }
}
