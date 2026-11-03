import { Module } from '@nestjs/common';
import { HistoricoModule } from '../historico/historico.module.js';
import { DispositivosController } from './dispositivos.controller.js';
import { DispositivosService } from './dispositivos.service.js';
import { DispositivoTypeormRepository } from './repositories/dispositivo-typeorm.repository.js';
import { DispositivoRepository } from './repositories/dispositivo.repository.js';
import {
  TransacaoDispositivos,
  TransacaoDispositivosTypeorm,
} from './repositories/transacao-dispositivos.js';

@Module({
  imports: [HistoricoModule],
  controllers: [DispositivosController],
  providers: [
    DispositivosService,
    { provide: DispositivoRepository, useClass: DispositivoTypeormRepository },
    { provide: TransacaoDispositivos, useClass: TransacaoDispositivosTypeorm },
  ],
})
export class DispositivosModule {}
