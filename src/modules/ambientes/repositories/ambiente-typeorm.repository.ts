import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  ehViolacaoDeUnicidade,
  RegistroDuplicadoError,
} from '../../../common/erros/registro-duplicado.error.js';
import { Dispositivo } from '../../dispositivos/entities/dispositivo.entity.js';
import { Ambiente } from '../entities/ambiente.entity.js';
import { AmbienteRepository } from './ambiente.repository.js';

@Injectable()
export class AmbienteTypeormRepository extends AmbienteRepository {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
  ) {
    super();
  }

  async criar(usuarioId: number, nome: string): Promise<Ambiente> {
    return this.traduzindoDuplicidade(() =>
      this.manager.save(Ambiente, this.manager.create(Ambiente, { usuarioId, nome })),
    );
  }

  listar(usuarioId: number): Promise<Ambiente[]> {
    return this.manager.find(Ambiente, {
      where: { usuarioId },
      order: { nome: 'ASC', id: 'ASC' },
    });
  }

  buscarPorId(id: number, usuarioId: number): Promise<Ambiente | null> {
    return this.manager.findOneBy(Ambiente, { id, usuarioId });
  }

  async renomear(id: number, usuarioId: number, nome: string): Promise<void> {
    await this.traduzindoDuplicidade(() =>
      this.manager.update(Ambiente, { id, usuarioId }, { nome }),
    );
  }

  removerSeSemDispositivos(id: number, usuarioId: number): Promise<boolean> {
    return this.manager.transaction(async (tx) => {
      await tx.findOne(Ambiente, {
        where: { id, usuarioId },
        lock: { mode: 'pessimistic_write' },
      });
      const ativos = await tx.countBy(Dispositivo, { ambienteId: id });
      if (ativos > 0) return false;
      await tx.softDelete(Ambiente, { id, usuarioId });
      return true;
    });
  }

  async encontrarOuCriar(usuarioId: number, nome: string): Promise<Ambiente> {
    const existente = await this.buscarAtivoPorNome(usuarioId, nome);
    if (existente) return existente;

    await this.manager.query(
      `INSERT INTO ambientes (nome, usuario_id) VALUES ($1, $2)
       ON CONFLICT (usuario_id, lower(nome)) WHERE removido_em IS NULL DO NOTHING`,
      [nome, usuarioId],
    );
    return this.buscarAtivoPorNome(usuarioId, nome) as Promise<Ambiente>;
  }

  private buscarAtivoPorNome(usuarioId: number, nome: string): Promise<Ambiente | null> {
    return this.manager
      .createQueryBuilder(Ambiente, 'a')
      .where('a.usuarioId = :usuarioId', { usuarioId })
      .andWhere('lower(a.nome) = lower(:nome)', { nome })
      .setLock('pessimistic_read')
      .getOne();
  }

  private async traduzindoDuplicidade<T>(operacao: () => Promise<T>): Promise<T> {
    try {
      return await operacao();
    } catch (erro) {
      if (ehViolacaoDeUnicidade(erro)) throw new RegistroDuplicadoError();
      throw erro;
    }
  }
}
