import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: 'STUDENT',
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        },
      },
      include: { profile: true },
    });

    this.logger.log(`New user registered: ${user.email}`);
    return this.generateTokens(user.id, user.email, user.role);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // ✅ Fix: use same error message for both cases — prevents user enumeration
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // ✅ Fix: check isActive before comparing password (avoid timing leaks)
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(user: any) {
    return this.generateTokens(user.id, user.email, user.role);
  }

  async findOrCreateGoogleUser(googleProfile: {
    googleId: string;
    email: string;
    name: string;
  }) {
    // First try to find by googleId
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleProfile.googleId },
    });

    if (!user) {
      // Check if email already registered via password; if so, link the Google account
      user = await this.prisma.user.findUnique({
        where: { email: googleProfile.email },
      });

      if (user) {
        // ✅ Fix: check isActive before linking Google account
        if (!user.isActive) {
          throw new UnauthorizedException('Account is deactivated');
        }
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleProfile.googleId },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email: googleProfile.email,
            googleId: googleProfile.googleId,
            role: 'STUDENT',
            profile: {
              create: { firstName: googleProfile.name, lastName: '' },
            },
          },
        });
        this.logger.log(`New Google user registered: ${user.email}`);
      }
    } else if (!user.isActive) {
      // ✅ Fix: check isActive on existing Google user
      throw new UnauthorizedException('Account is deactivated');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string) {
    // ✅ Fix: validate input before attempting verify
    if (!refreshToken?.trim()) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, isActive: true },
      });

      // ✅ Fix: check user exists AND is still active
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch (err) {
      // Re-throw our own UnauthorizedException as-is; wrap JWT errors
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
