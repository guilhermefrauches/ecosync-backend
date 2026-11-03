import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Dispositivo } from '../../dispositivos/entities/dispositivo.entity.js';
import { HistoricoUso } from '../entities/historico-uso.entity.js';
import { type FiltroHistorico, HistoricoRepository } from './historico.repository.js';

@Injectable()
export class HistoricoTypeormRepository extends HistoricoRepository {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
  ) {
    super();
  }

  async abrirSessao(dispositivoId: number, ligadoEm: Date): Promise<void> {
    await this.manager.insert(HistoricoUso, {
      dispositivoId,
      dataHoraLigado: ligadoEm,
    });
  }

  buscarSessaoAberta(dispositivoId: number): Promise<HistoricoUso | null> {
    return this.manager
      .createQueryBuilder(HistoricoUso, 'h')
      .where('h.dispositivoId = :dispositivoId', { dispositivoId })
      .andWhere('h.dataHoraDesligado IS NULL')
      .getOne();
  }

  async fecharSessao(id: number, desligadoEm: Date, consumoKwh: number): Promise<void> {
    await this.manager.update(
      HistoricoUso,
      { id },
      { dataHoraDesligado: desligadoEm, consumoKwh },
    );
  }

  async listar(filtro: FiltroHistorico): Promise<{ itens: HistoricoUso[]; total: number }> {
    const consulta = this.manager
      .createQueryBuilder(HistoricoUso, 'h')
      .withDeleted()
      .innerJoinAndSelect('h.dispositivo', 'd')
      .innerJoinAndSelect('d.ambiente', 'a')
      .where('a.usuarioId = :usuarioId', { usuarioId: filtro.usuarioId });

    if (filtro.dispositivoId !== undefined) {
      consulta.andWhere('h.dispositivoId = :dispositivoId', {
        dispositivoId: filtro.dispositivoId,
      });
    }
    if (filtro.ate) {
      consulta.andWhere('h.dataHoraLigado < :ate', { ate: filtro.ate });
    }
    if (filtro.de) {
      consulta.andWhere(
        '(h.dataHoraDesligado IS NULL OR h.dataHoraDesligado > :de)',
        { de: filtro.de },
      );
    }

    const [itens, total] = await consulta
      .orderBy('h.dataHoraLigado', 'DESC')
      .addOrderBy('h.id', 'DESC')
      .offset((filtro.pagina - 1) * filtro.limite)
      .limit(filtro.limite)
      .getManyAndCount();
    return { itens, total };
  }

  usuarioPossuiDispositivo(usuarioId: number, dispositivoId: number): Promise<boolean> {
    return this.manager
      .createQueryBuilder(Dispositivo, 'd')
      .withDeleted()
      .innerJoin('d.ambiente', 'a')
      .where('d.id = :dispositivoId', { dispositivoId })
      .andWhere('a.usuarioId = :usuarioId', { usuarioId })
      .getExists();
  }
}
