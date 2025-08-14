import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { RolesGuard } from 'src/roles/role-guard/role.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  login(@Body() authDto:AuthDto) {
    return this.authService.login(authDto);
  }
  @UseGuards(RolesGuard)
  @Patch('change-password')
  changePassword(@Body() authDto:AuthDto) {
    return this.authService.changePassword(authDto);
  }
}
