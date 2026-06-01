import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
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
        role: 'STUDENT', // public registration defaults to student
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        },
      },
      include: { profile: true },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash)
      throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(user: any) {
    // user object comes from local strategy (which calls validateUser)
    return this.generateTokens(user.id, user.email, user.role);
  }

  async findOrCreateGoogleUser(googleProfile: {
    googleId: string;
    email: string;
    name: string;
  }) {
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleProfile.googleId },
    });
    if (!user) {
      // Check if email already registered via password; if so, link the Google account
      user = await this.prisma.user.findUnique({
        where: { email: googleProfile.email },
      });
      if (user) {
        // Link existing account with Google ID
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
      }
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
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
