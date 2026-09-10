import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** 注入当前登录用户（由 JwtStrategy.validate 填充） */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as { id: string; username: string };
  },
);