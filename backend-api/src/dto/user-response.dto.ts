import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: 5,
  })
  id: number;

  @ApiProperty({
    description: 'User email address',
    example: 'aaassa@12.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'Jon',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-12-20T12:48:20.969Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Update timestamp',
    example: '2025-12-20T12:48:20.969Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Deleted timestamp',
    example: '2025-12-20T12:48:20.969Z',
  })
  deletedAt: Date;
}
