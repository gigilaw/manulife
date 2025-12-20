// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRegisterDto } from '../dto/user-register.dto';
import { TokensDto } from '../dto/tokens.dto';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { constants } from '../constants/index';
import { config } from 'dotenv';

config();
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,

    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(userRegisterDto: UserRegisterDto): Promise<any> {
    const existingUser = await this.userRepository.findOne({
      where: { email: userRegisterDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(userRegisterDto.password, 10);

    // Create and save user
    const user = this.userRepository.create({
      email: userRegisterDto.email,
      firstName: userRegisterDto.firstName,
      lastName: userRegisterDto.lastName,
      password: hashedPassword,
    });

    await this.userRepository.save(user);
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  async refreshToken(refreshToken: string): Promise<TokensDto> {
    try {
      // Verify JWT signature and expiry
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Check if token is revovked
      const tokenHash = this.hashToken(refreshToken);
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { tokenHash, isRevoked: false },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check for user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens & revovke old refresh token
      storedToken.isRevoked = true;
      await this.refreshTokenRepository.save(storedToken);

      return await this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(user: any): Promise<TokensDto> {
    const payload = {
      email: user.email,
      sub: user.id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: constants.accessTokenTTL,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: constants.refreshTokenTTL,
      }),
    ]);

    // Save refresh token
    const tokenHash = this.hashToken(refreshToken);
    const token = this.refreshTokenRepository.create({
      tokenHash,
      user,
    });

    await this.refreshTokenRepository.save(token);

    return {
      accessToken,
      refreshToken,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
