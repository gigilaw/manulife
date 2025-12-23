import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';

import { AuthService } from '../src/services/auth.service';
import { User } from '../src/entities/user.entity';
import { RefreshToken } from '../src/entities/refresh-token.entity';
import { Portfolio } from '../src/entities/portfolio.entity';

// Mock data
const mockUser = {
  id: 1,
  email: 'user@test.com',
  firstName: 'Test',
  lastName: 'User',
  password: 'hashedPassword123',
};

const mockTokens = {
  accessToken: 'mockAccessToken',
  refreshToken: 'mockRefreshToken',
};

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let refreshTokenRepository: Repository<RefreshToken>;
  let portfolioRepository: Repository<Portfolio>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Portfolio),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verify: jest.fn(),
            decode: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
    portfolioRepository = module.get<Repository<Portfolio>>(
      getRepositoryToken(Portfolio),
    );
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Mock user doesn't exist
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      // Mock user creation and saving
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as any);

      // Mock portfolio creation
      jest.spyOn(portfolioRepository, 'create').mockReturnValue({
        id: 'portfolio-id',
        user: mockUser,
      } as any);
      jest.spyOn(portfolioRepository, 'save').mockResolvedValue({} as any);

      // Mock login (called after registration)
      jest.spyOn(service, 'login' as any).mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const result = await service.register(mockUser as any);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);

      await expect(service.register(mockUser as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: mockUser.email,
        password: 'Password123!',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest
        .spyOn(bcrypt, 'compare' as any)
        .mockImplementation(() => Promise.resolve(true));
      jest
        .spyOn(service as any, 'generateTokens')
        .mockResolvedValue(mockTokens);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
    });

    it('should throw UnauthorizedException with invalid email', async () => {
      const loginDto = {
        email: 'wrong@email.com',
        password: 'Password123!',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const loginDto = {
        email: mockUser.email,
        password: 'WrongPassword123!',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest
        .spyOn(bcrypt, 'compare' as any)
        .mockImplementation(() => Promise.resolve(false));

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'validRefreshToken';
      const payload = { sub: mockUser.id, email: mockUser.email };
      const tokenHash = 'hashedToken';

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      jest.spyOn(service as any, 'hashToken').mockReturnValue(tokenHash);
      jest.spyOn(refreshTokenRepository, 'findOne').mockResolvedValue({
        id: mockUser.id,
        user: mockUser,
        isRevoked: false,
      } as any);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest
        .spyOn(service as any, 'generateTokens')
        .mockResolvedValue(mockTokens);

      const result = await service.refreshToken(refreshToken);

      expect(result).toEqual(mockTokens);
      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    });

    it('should throw UnauthorizedException with revoked token', async () => {
      const refreshToken = 'revokedToken';
      const payload = { sub: mockUser.id, email: mockUser.email };

      jest.spyOn(jwtService, 'verify').mockReturnValue(payload as any);
      jest.spyOn(service as any, 'hashToken').mockReturnValue('hash');
      jest.spyOn(refreshTokenRepository, 'findOne').mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const refreshToken = 'validToken';
      const tokenHash = 'hashedToken';

      jest.spyOn(service as any, 'hashToken').mockReturnValue(tokenHash);
      jest
        .spyOn(refreshTokenRepository, 'findOne')
        .mockResolvedValue({ id: mockUser.id, isRevoked: false } as any);
      jest
        .spyOn(refreshTokenRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any);

      const result = await service.logout(refreshToken, mockUser.id);

      expect(result.message).toContain('Logged out successfully');
    });
  });
});
