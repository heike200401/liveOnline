import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class UploadService {
  private getUploadDir(): string {
    const dir = process.env.UPLOAD_DIR ?? 'uploads';
    const abs = join(process.cwd(), dir);
    if (!existsSync(abs)) {
      mkdirSync(abs, { recursive: true });
    }
    return abs;
  }

  /**
   * 保存上传图片，返回公网访问 URL
   */
  saveImage(file: Express.Multer.File): { url: string } {
    if (!file) {
      throw new BadRequestException('未接收到文件');
    }

    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      throw new BadRequestException(
        '仅支持 jpg/png/jpeg/gif/webp 格式',
      );
    }

    if (file.size > MAX_SIZE) {
      throw new BadRequestException('单张图片不能超过 5MB');
    }

    const filename = `${randomUUID()}${ext}`;
    const absPath = join(this.getUploadDir(), filename);

    // Multer 使用 memoryStorage，从 buffer 写入文件
    if (file.buffer) {
      writeFileSync(absPath, file.buffer);
    } else {
      throw new BadRequestException('文件内容缺失');
    }

    const baseUrl = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const uploadDirName = process.env.UPLOAD_DIR ?? 'uploads';
    return { url: `${baseUrl}/static/${uploadDirName}/${filename}` };
  }

  /**
   * 校验图片（供 save 阶段复用）
   */
  validate(file?: Express.Multer.File) {
    if (!file) return;
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      throw new BadRequestException('仅支持 jpg/png/jpeg/gif/webp 格式');
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('单张图片不能超过 5MB');
    }
  }
}