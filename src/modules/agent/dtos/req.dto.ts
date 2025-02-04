import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

@Exclude()
export class AgentConnectReqDto {
  @Expose()
  @ApiProperty({
    type: String,
    required: true,
    example: '1',
    description: 'Agent ID',
  })
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @Expose()
  @ApiProperty({
    type: String,
    required: true,
    example: '3d35b13b420a02e58082db61037768a9',
    description: 'Access token be encoded',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @Expose()
  @ApiProperty({
    type: String,
    required: true,
    example: '3d35b13b420a02e58082db61037768a9',
    description: 'Refresh token be encoded',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
