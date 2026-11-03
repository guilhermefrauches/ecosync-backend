import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { AmbienteTypeormRepository } from '../../ambientes/repositories/ambiente-typeorm.repository.js';
import type { AmbienteRepository } from '../../ambientes/repositories/ambiente.repository.js';
import { HistoricoTypeormRepository } from '../../historico/repositories/historico-typeorm.repository.js';
import type { HistoricoRepository } from '../../historico/repositories/historico.repository.js';
import { DispositivoTypeormRepository } from './dispositivo-typeorm.repository.js';
import type { DispositivoRepository } from './dispositivo.repository.js';

export interface RepositoriosDaTransacao {
  dispositivos: DispositivoRepository;
  ambientes: AmbienteRepository;
  historico: HistoricoRepository;
}

export abstract class TransacaoDispositivos {
  abstract executar<T>(
    trabalho: (repositorios: RepositoriosDaTransacao) => Promise<T>,
  ): Promise<T>;
}

@Injectable()
export class TransacaoDispositivosTypeorm extends TransacaoDispositivos {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
  ) {
    super();
  }

  executar<T>(
    trabalho: (repositorios: RepositoriosDaTransacao) => Promise<T>,
  ): Promise<T> {
    return this.manager.transaction((tx) =>
      trabalho({
        dispositivos: new DispositivoTypeormRepository(tx),
        ambientes: new AmbienteTypeormRepository(tx),
        historico: new HistoricoTypeormRepository(tx),
      }),
    );
  }
}
