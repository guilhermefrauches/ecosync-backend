import { type INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { FiltroErros } from './common/erros/filtro-erros.js';
import { erroDeValidacao } from './common/validacao/erro-validacao.js';

export function configurarApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalFilters(new FiltroErros());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: erroDeValidacao,
    }),
  );
}
