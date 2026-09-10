import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class SkillHoursDto {
  @IsString()
  @IsNotEmpty()
  skillId: string;

  @IsNumber()
  @Min(0)
  hours: number;
}

export class RecordImageDto {
  @IsString()
  @IsNotEmpty()
  url: string;
}

/**
 * 提交/保存打卡记录的请求体
 * 草稿与正式提交共用此 DTO，由服务层按时间窗口决定状态
 */
export class SaveDailyRecordDto {
  /** 记录日期 YYYY-MM-DD，缺省为今天 */
  @IsString()
  @IsOptional()
  recordDate?: string;

  /** 各技能学习时长 */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillHoursDto)
  skillHours: SkillHoursDto[];

  /** 文字心得（必填 1~2000 字） */
  @IsString()
  @MinLength(1, { message: '文字心得不可为空' })
  @MaxLength(2000)
  textContent: string;

  /** 图片 URL（1~9 张） */
  @IsArray()
  @ArrayMinSize(1, { message: '至少需要 1 张图片' })
  @ArrayMaxSize(9, { message: '最多 9 张图片' })
  @IsString({ each: true })
  imageUrls: string[];

  /** 标签 ID（1~5 个） */
  @IsArray()
  @ArrayMinSize(1, { message: '至少需要 1 个标签' })
  @ArrayMaxSize(5, { message: '最多 5 个标签' })
  @IsString({ each: true })
  tagIds: string[];
}