import { Global, Module } from '@nestjs/common';
import { Relogio, RelogioSistema } from './relogio/relogio.js';

@Global()
@Module({
  providers: [{ provide: Relogio, useClass: RelogioSistema }],
  exports: [Relogio],
})
export class CommonModule {}
