import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { UserRegisterDto } from 'src/dto/user-register.dto';
import { UserLoginDto } from 'src/dto/user-login.dto';
import { UserLogoutDto } from 'src/dto/user-logout.dto';
import { AuthGuard } from '@nestjs/passport';
import { TokensDto, RefreshTokenDto } from 'src/dto/tokens.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        user: {
          id: '1',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
          deletedAt: null,
        },
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Email already registered' })
  async register(@Body() userRegisterDto: UserRegisterDto): Promise<any> {
    return this.authService.register(userRegisterDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'User login',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        user: {
          id: '1',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
          deletedAt: null,
        },
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid email or password',
        error: 'Unauthorized',
      },
    },
  })
  async login(@Body() userLoginDto: UserLoginDto): Promise<any> {
    return await this.authService.login(userLoginDto);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'User logout',
    description: `Revoke refresh token to prevent further access.`,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer access token',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      example: {
        message: 'Logged out successfully. Refresh token revoked.',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Invalid or already revoked refresh token',
    schema: {
      example: {
        statusCode: 404,
        message: 'Invalid or already revoked refresh token',
        error: 'Not Found',
      },
    },
  })
  async logout(
    @Req() req: Request,
    @Body() userlogoutDto: UserLogoutDto,
  ): Promise<{ message: string }> {
    const user = req['user'] as { userId: number; email: string };
    return await this.authService.logout(
      userlogoutDto.refreshToken,
      user.userId,
    );
  }

  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh access token',
    description: `Exchange a valid refresh token for new access and refresh tokens, revovke old refresh token.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    schema: {
      example: {
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid, expired, or revoked refresh token',
    content: {
      'application/json': {
        examples: {
          invalidToken: {
            summary: 'Invalid token',
            value: {
              statusCode: 401,
              message: 'Invalid refresh token',
              error: 'Unauthorized',
            },
          },
          userNotFound: {
            summary: 'User not found',
            value: {
              statusCode: 401,
              message: 'User not found',
              error: 'Unauthorized',
            },
          },
        },
      },
    },
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokensDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}
