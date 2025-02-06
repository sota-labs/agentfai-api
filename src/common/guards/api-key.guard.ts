import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AgentService } from 'modules/agent/services/agent.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly agentService: AgentService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    console.log('apiKey', apiKey);

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    const agent = await this.agentService.findByApiKey(apiKey);

    if (!agent) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach the agent to the request for later use if needed
    request.agent = agent;
    return true;
  }

  private extractApiKey(request: any): string | undefined {
    // Try to extract from X-API-Key header
    const apiKey = request.headers['x-api-key'] ?? request.headers['X-API-KEY'];
    if (apiKey) {
      return apiKey;
    }

    // Try to extract from Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to extract from query parameter
    return request.query.apiKey;
  }
}
