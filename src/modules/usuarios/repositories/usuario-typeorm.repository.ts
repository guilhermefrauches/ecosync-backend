import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  ehViolacaoDeUnicidade,
  RegistroDuplicadoError,
} from '../../../common/erros/registro-duplicado.error.js';
import { Usuario } from '../entities/usuario.entity.js';
import { type NovoUsuario, UsuarioRepository } from './usuario.repository.js';

@Injectable()
export class UsuarioTypeormRepository extends UsuarioRepository {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
  ) {
    super();
  }

  async criar(dados: NovoUsuario): Promise<Usuario> {
    return this.traduzindoDuplicidade(() =>
      this.manager.save(Usuario, this.manager.create(Usuario, dados)),
    );
  }

  buscarPorId(id: number): Promise<Usuario | null> {
    return this.manager.findOneBy(Usuario, { id });
  }

  buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.manager
      .createQueryBuilder(Usuario, 'u')
      .where('lower(u.email) = lower(:email)', { email })
      .getOne();
  }

  async atualizar(id: number, dados: Partial<NovoUsuario>): Promise<void> {
    await this.traduzindoDuplicidade(() =>
      this.manager.update(Usuario, { id }, dados),
    );
  }

  async removerComDados(id: number, agora: Date): Promise<void> {
    await this.manager.transaction(async (tx) => {
      await tx.query(
        `UPDATE dispositivos d
            SET status_atual = FALSE, removido_em = $2
           FROM ambientes a
          WHERE d.ambiente_id = a.id AND a.usuario_id = $1 AND d.removido_em IS NULL`,
        [id, agora],
      );
      await tx.query(
        `UPDATE historico_uso h
            SET data_hora_desligado =
                  GREATEST($2::timestamptz, h.data_hora_ligado + interval '1 millisecond'),
                consumo_kwh = d.potencia_watts / 1000 * EXTRACT(EPOCH FROM
                  GREATEST($2::timestamptz, h.data_hora_ligado + interval '1 millisecond')
                  - h.data_hora_ligado) / 3600
           FROM dispositivos d
           JOIN ambientes a ON a.id = d.ambiente_id
          WHERE h.dispositivo_id = d.id
            AND a.usuario_id = $1
            AND h.data_hora_desligado IS NULL`,
        [id, agora],
      );
      await tx.query(
        `UPDATE ambientes SET removido_em = $2 WHERE usuario_id = $1 AND removido_em IS NULL`,
        [id, agora],
      );
      await tx.softDelete(Usuario, { id });
    });
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
