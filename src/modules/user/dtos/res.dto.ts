import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResDto {
  @Expose()
  @ApiProperty({
    type: String,
  })
  userId: string;

  @Expose()
  @ApiProperty({
    type: String,
  })
  zkAddress: string;

  @Expose()
  @ApiProperty({
    type: String,
    required: false,
  })
  name?: string;

  @Expose()
  @ApiProperty({
    type: String,
    required: false,
  })
  avatar?: string;
}
