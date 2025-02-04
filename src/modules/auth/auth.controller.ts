import { Controller, Post, Body } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginReqDto } from './dtos/req.dto';
import { LoginResDto } from './dtos/res.dto';
import { AuthService } from './services/auth.service';
import { Public } from 'common/decorators/public.decorator';

@Controller({
  path: 'auth',
  version: '1',
})
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login-google')
  @Public()
  @ApiBody({ type: LoginReqDto })
  @ApiResponse({ type: LoginResDto })
  async loginGoogle(@Body() body: LoginReqDto): Promise<LoginResDto> {
    return this.authService.loginGoogle(body);
  }
}
