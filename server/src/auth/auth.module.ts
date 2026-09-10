import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';

// register() 会提供 AuthModuleOptions，供各模块中的 JwtAuthGuard 解析依赖
const passportModule = PassportModule.register({ defaultStrategy: 'jwt' });

@Module({
  imports: [passportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [passportModule, AuthService],
})
export class AuthModule {}
