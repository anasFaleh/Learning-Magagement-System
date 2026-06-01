// auth.controller.ts
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
  ApiBody 
} from '@nestjs/swagger'; // 👈 Imported Swagger decorators
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Request, Response } from 'express';

@ApiTags('Authentication') // 👈 Groups all these endpoints under "Authentication" in Swagger UI
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed.' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists.' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and return JWT tokens' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials.' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth2 authentication flow' })
  googleAuth() {
    // initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth2 callback redirect' })
  googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    

    const user = req.user as any;
    
    const accessToken = user.accessToken || user.tokens?.accessToken;
    const refreshToken = user.refreshToken || user.tokens?.refreshToken;

    res.redirect(
      `${process.env.FRONTEND_URL}/oauth?accessToken=${accessToken}&refreshToken=${refreshToken}`,
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Generate a new Access Token using a Refresh Token' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } 
      } 
    } 
  })
  @ApiResponse({ status: 200, description: 'New access token generated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid refresh token.' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }
}