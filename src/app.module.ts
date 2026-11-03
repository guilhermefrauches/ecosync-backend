import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module.js';
import { validarEnv, type Env } from './config/env.validation.js';
import { opcoesTypeOrm } from './config/typeorm.config.js';
import { AmbientesModule } from './modules/ambientes/ambientes.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { DispositivosModule } from './modules/dispositivos/dispositivos.module.js';
import { HistoricoModule } from './modules/historico/historico.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        opcoesTypeOrm({
          DB_HOST: config.get('DB_HOST', { infer: true }),
          DB_PORTA: config.get('DB_PORTA', { infer: true }),
          DB_USUARIO: config.get('DB_USUARIO', { infer: true }),
          DB_SENHA: config.get('DB_SENHA', { infer: true }),
          DB_NOME: config.get('DB_NOME', { infer: true }),
        }),
    }),
    CommonModule,
    UsuariosModule,
    AuthModule,
    AmbientesModule,
    HistoricoModule,
    DispositivosModule,
    DashboardModule,
  ],
})
export class AppModule {}
