import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

@Exclude()
export class LoginReqDto {
  @Expose()
  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  idToken: string;
}
