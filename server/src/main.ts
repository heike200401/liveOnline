import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module.js';
import { PayloadTooLargeFilter } from './common/filters/payload-too-large.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 413 大小超限错误转友好中文提示
  app.useGlobalFilters(new PayloadTooLargeFilter());

  // 全局前缀：所有接口挂在 /api 下
  app.setGlobalPrefix('api');

  // 静态资源：上传的图片通过 /static/uploads 访问
  app.useStaticAssets(join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads'), {
    prefix: '/static/uploads',
  });

  // 全局校验管道
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // 跨域：允许前端开发服务器访问
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
