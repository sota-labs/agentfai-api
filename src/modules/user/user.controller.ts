import { BadRequestException, Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { UserService } from 'modules/user/user.service';
import { UserResDto } from 'modules/user/dtos/res.dto';
import { UserId } from 'common/decorators/user-id.decorator';

@Controller({
  path: 'user',
  version: '1',
})
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiResponse({ type: UserResDto })
  async getMe(@UserId() userId: string): Promise<UserResDto> {
    const user = await this.userService.findOneByUserId(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return plainToInstance(UserResDto, user);
  }
}
