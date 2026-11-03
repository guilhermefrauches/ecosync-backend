import { Module } from '@nestjs/common';
import { AmbientesController } from './ambientes.controller.js';
import { AmbientesService } from './ambientes.service.js';
import { AmbienteTypeormRepository } from './repositories/ambiente-typeorm.repository.js';
import { AmbienteRepository } from './repositories/ambiente.repository.js';

@Module({
  controllers: [AmbientesController],
  providers: [
    AmbientesService,
    { provide: AmbienteRepository, useClass: AmbienteTypeormRepository },
  ],
})
export class AmbientesModule {}
