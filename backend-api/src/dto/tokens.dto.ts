import { ApiProperty } from '@nestjs/swagger';

export class TokensDto {
  @ApiProperty({ example: 'refresh_token_here' })
  refreshToken: string;

  @ApiProperty({ example: 'access_token_here' })
  accessToken: string;
}
