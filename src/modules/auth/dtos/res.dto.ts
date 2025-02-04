import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class LoginResDto {
  @Expose()
  @ApiProperty({
    type: String,
  })
  accessToken: string;

  @Expose()
  @ApiProperty({
    type: String,
  })
  salt: string;
}
