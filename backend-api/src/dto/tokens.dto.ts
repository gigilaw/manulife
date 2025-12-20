import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TokensDto {
  @ApiProperty({ example: 'refresh_token_here' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiProperty({ example: 'access_token_here' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
