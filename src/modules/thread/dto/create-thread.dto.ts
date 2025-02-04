import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateThreadDto {
  @ApiProperty()
  agentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  question: string;
}
