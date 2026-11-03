import { Module } from '@nestjs/common';
import { CalculadoraConsumo } from './calculadora-consumo.js';
import { HistoricoController } from './historico.controller.js';
import { HistoricoService } from './historico.service.js';
import { ConsumoTypeormRepository } from './repositories/consumo-typeorm.repository.js';
import { ConsumoRepository } from './repositories/consumo.repository.js';
import { HistoricoTypeormRepository } from './repositories/historico-typeorm.repository.js';
import { HistoricoRepository } from './repositories/historico.repository.js';

@Module({
  controllers: [HistoricoController],
  providers: [
    HistoricoService,
    CalculadoraConsumo,
    { provide: HistoricoRepository, useClass: HistoricoTypeormRepository },
    { provide: ConsumoRepository, useClass: ConsumoTypeormRepository },
  ],
  exports: [ConsumoRepository, CalculadoraConsumo],
})
export class HistoricoModule {}
