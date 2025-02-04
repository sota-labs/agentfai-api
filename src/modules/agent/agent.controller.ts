import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { AgentService } from 'modules/agent/services/agent.service';
import { AgentConnectedResDto, AgentResDto } from 'modules/agent/dtos/res.dto';
import { Public } from 'common/decorators/public.decorator';
import { MessageResDto } from 'common/dtos/message.dto';
import { UserId } from 'common/decorators/user-id.decorator';
import { AgentConnectReqDto } from 'modules/agent/dtos/req.dto';
import { AgentConnectedService } from 'modules/agent/services/agent-connected.service';

@Controller({
  path: 'agent',
  version: '1',
})
@ApiTags('Agent')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly agentConnectedService: AgentConnectedService,
  ) {}

  @Get()
  @Public()
  @ApiResponse({ type: [AgentResDto] })
  async getAgents(): Promise<AgentResDto[]> {
    const agents = await this.agentService.findAll();

    return plainToInstance(AgentResDto, agents);
  }

  @Post('connect')
  @ApiBearerAuth()
  @ApiResponse({ type: MessageResDto })
  async connectAgent(@UserId() userId: string, @Body() body: AgentConnectReqDto): Promise<MessageResDto> {
    await this.agentConnectedService.connectAgent(userId, body);

    return plainToInstance(MessageResDto, {
      message: 'Agent connected successfully',
    });
  }

  @Get('connected')
  @ApiBearerAuth()
  @ApiResponse({ type: [AgentConnectedResDto] })
  async getConnectedAgents(@UserId() userId: string): Promise<AgentConnectedResDto[]> {
    const agents = await this.agentConnectedService.findByUserId(userId);

    return plainToInstance(AgentConnectedResDto, agents);
  }
}
