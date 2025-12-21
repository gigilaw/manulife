import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { config } from 'dotenv';

import { constants } from '../constants/index';

import { UserRegisterDto } from '../dto/user-register.dto';
import { TokensDto } from '../dto/tokens.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserLoginDto } from '../dto/user-login.dto';

import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

config();

interface TokenPayload {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
}
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,

    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(
    userRegisterDto: UserRegisterDto,
  ): Promise<{ user: UserResponseDto; tokens: TokensDto }> {
    const existingUser = await this.userRepository.findOne({
      where: { email: userRegisterDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = (await bcrypt.hash(
      userRegisterDto.password,
      10,
    )) as string;

    // Create and save user
    const user = this.userRepository.create({
      email: userRegisterDto.email,
      firstName: userRegisterDto.firstName,
      lastName: userRegisterDto.lastName,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    // Automatically login user upon successful registration
    return await this.login({
      email: userRegisterDto.email,
      password: userRegisterDto.password,
    });
  }

  async login(
    loginDto: UserLoginDto,
  ): Promise<{ user: UserResponseDto; tokens: TokensDto }> {
    // Check if email exists
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = (await bcrypt.compare(
      loginDto.password,
      user.password,
    )) as boolean;

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(
      { id: user.id, email: user.email },
      user,
    );

    return {
      user,
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokensDto> {
    try {
      // Verify JWT signature and expiry
      const payload: TokenPayload = this.jwtService.verify(refreshToken, {
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

      return await this.generateTokens(
        { id: user.id, email: user.email },
        user,
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(
    refreshToken: string,
    userId: number,
  ): Promise<{ message: string }> {
    const tokenHash = this.hashToken(refreshToken);

    try {
      const existingToken = await this.refreshTokenRepository.findOne({
        where: {
          tokenHash,
          user: { id: userId },
          isRevoked: false,
        },
      });
      if (!existingToken) {
        throw new NotFoundException('Invalid or already revoked refresh token');
      }

      await this.refreshTokenRepository.update(
        {
          tokenHash,
          user: { id: userId },
          isRevoked: false,
        },
        {
          isRevoked: true,
        },
      );

      return { message: 'Logged out successfully. Refresh token revoked.' };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        message: `Logout completed with issues: ${errorMessage}`,
      };
    }
  }

  private async generateTokens(
    userDto: { id: number; email: string },
    user: User,
  ): Promise<TokensDto> {
    const payload = {
      email: userDto.email,
      sub: userDto.id,
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
