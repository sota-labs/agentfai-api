import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AgentResDto {
  @Expose()
  @ApiProperty({ type: String })
  agentId: string;

  @Expose()
  @ApiProperty({ type: String })
  name: string;

  @Expose()
  @ApiProperty({ type: String })
  description: string;

  @Expose()
  @ApiProperty({ type: String })
  logoUrl: string;
}

@Exclude()
export class AgentConnectedResDto {
  @Expose()
  @ApiProperty({ type: String })
  agentId: string;

  @Expose()
  @ApiProperty({ type: Number })
  accessTokenExpiresAt: number;

  @Expose()
  @ApiProperty({ type: Number })
  refreshTokenExpiresAt: number;
}
