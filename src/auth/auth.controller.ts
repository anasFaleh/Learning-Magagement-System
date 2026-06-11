import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and return JWT tokens' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth2 authentication flow' })
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth2 callback redirect' })
  googleAuthRedirect(@Req() req: any, @Res() res: any) {
    const tokens = req.user as { accessToken: string; refreshToken: string };
    // ✅ Fix: use ConfigService instead of process.env
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    return res.redirect(
      `${frontendUrl}/oauth?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Get new access token using refresh token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string', example: 'eyJhbGci...' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'New access token generated.' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }
}
