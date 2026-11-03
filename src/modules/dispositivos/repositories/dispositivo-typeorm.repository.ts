import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Dispositivo } from '../entities/dispositivo.entity.js';
import {
  type DadosDispositivo,
  DispositivoRepository,
} from './dispositivo.repository.js';

@Injectable()
export class DispositivoTypeormRepository extends DispositivoRepository {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
  ) {
    super();
  }

  async criar(dados: DadosDispositivo): Promise<Dispositivo> {
    return this.manager.save(Dispositivo, this.manager.create(Dispositivo, dados));
  }

  listar(usuarioId: number): Promise<Dispositivo[]> {
    return this.doUsuario(usuarioId)
      .orderBy('d.nome', 'ASC')
      .addOrderBy('d.id', 'ASC')
      .getMany();
  }

  buscarPorId(id: number, usuarioId: number): Promise<Dispositivo | null> {
    return this.doUsuario(usuarioId).andWhere('d.id = :id', { id }).getOne();
  }

  buscarComLock(id: number, usuarioId: number): Promise<Dispositivo | null> {
    return this.doUsuario(usuarioId)
      .andWhere('d.id = :id', { id })
      .setLock('pessimistic_write', undefined, ['d'])
      .getOne();
  }

  async atualizar(
    id: number,
    dados: Partial<DadosDispositivo> & { statusAtual?: boolean },
  ): Promise<void> {
    await this.manager.update(Dispositivo, { id }, dados);
  }

  async remover(id: number): Promise<void> {
    await this.manager.update(Dispositivo, { id }, { statusAtual: false });
    await this.manager.softDelete(Dispositivo, { id });
  }

  private doUsuario(usuarioId: number) {
    return this.manager
      .createQueryBuilder(Dispositivo, 'd')
      .innerJoinAndSelect('d.ambiente', 'a')
      .where('a.usuarioId = :usuarioId', { usuarioId });
  }
}
