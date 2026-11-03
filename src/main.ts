import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.validation.js';
import { configurarApp } from './configurar-app.js';

const app = await NestFactory.create<NestExpressApplication>(AppModule);
const config = app.get<ConfigService<Env, true>>(ConfigService);

if (config.get('CONFIAR_NO_PROXY', { infer: true })) {
  app.set('trust proxy', 1);
}
configurarApp(app);
await app.listen(config.get('PORTA', { infer: true }));
