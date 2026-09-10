import { ExceptionFilter, Catch, ArgumentsHost, PayloadTooLargeException } from '@nestjs/common';

/**
 * 将 multer / body 大小超限的 413 错误转为友好的中文提示
 */
@Catch(PayloadTooLargeException)
export class PayloadTooLargeFilter implements ExceptionFilter {
  catch(exception: PayloadTooLargeException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    res.status(413).json({
      statusCode: 413,
      message: '单张图片不能超过 5MB，请选择更小的图片',
    });
  }
}
