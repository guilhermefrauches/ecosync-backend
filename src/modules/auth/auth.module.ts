import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  CookieSessao,
  VALIDADE_SESSAO_SEGUNDOS,
} from '../../common/sessao/cookie-sessao.js';
import type { Env } from '../../config/env.validation.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    UsuariosModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SEGREDO', { infer: true }),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: VALIDADE_SESSAO_SEGUNDOS,
        },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => [
        {
          ttl: 60_000,
          limit: config.get('LOGIN_LIMITE_POR_MINUTO', { infer: true }),
        },
      ],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    CookieSessao,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
