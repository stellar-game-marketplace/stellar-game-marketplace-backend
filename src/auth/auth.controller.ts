import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthChallengeDto, AuthVerifyDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('challenge')
  challenge(@Body() dto: AuthChallengeDto) {
    return this.authService.generateChallenge(dto.address);
  }

  @Post('verify')
  verify(@Body() dto: AuthVerifyDto) {
    return this.authService.verify(dto.address, dto.challenge, dto.signature);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Request() req: any) {
    return req.user;
  }
}
