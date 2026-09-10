import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color 必须是 #RRGGBB 格式' })
  color?: string;
}

export class UpdateTagDto {
  @IsString()
  @IsOptional()
  @MaxLength(30)
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color 必须是 #RRGGBB 格式' })
  color?: string;
}