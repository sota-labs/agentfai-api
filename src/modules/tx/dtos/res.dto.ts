import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TxBuyResDto {
  @Expose()
  @ApiProperty({ required: true, description: 'Request ID' })
  requestId: string;

  @Expose()
  @ApiProperty({ required: true, description: 'Transaction data' })
  txData: string;
}

@Exclude()
export class ExecuteTxBuyResDto {
  @Expose()
  @ApiProperty({ required: true, description: 'Transaction hash' })
  txHash: string;
}
