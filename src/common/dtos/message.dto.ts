import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MessageResDto {
  @Expose()
  @ApiProperty({ example: 'Success' })
  message: string;
}
