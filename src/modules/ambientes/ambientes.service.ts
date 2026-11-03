import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegistroDuplicadoError } from '../../common/erros/registro-duplicado.error.js';
import { AmbienteRespostaDto } from './dto/ambiente.dto.js';
import type { Ambiente } from './entities/ambiente.entity.js';
import { AmbienteRepository } from './repositories/ambiente.repository.js';

@Injectable()
export class AmbientesService {
  constructor(private readonly ambientes: AmbienteRepository) {}

  async criar(usuarioId: number, nome: string): Promise<AmbienteRespostaDto> {
    const ambiente = await this.tratandoNomeEmUso(() =>
      this.ambientes.criar(usuarioId, nome),
    );
    return AmbienteRespostaDto.de(ambiente);
  }

  async listar(usuarioId: number): Promise<AmbienteRespostaDto[]> {
    const ambientes = await this.ambientes.listar(usuarioId);
    return ambientes.map((ambiente) => AmbienteRespostaDto.de(ambiente));
  }

  async obter(id: number, usuarioId: number): Promise<AmbienteRespostaDto> {
    return AmbienteRespostaDto.de(await this.buscar(id, usuarioId));
  }

  async renomear(
    id: number,
    usuarioId: number,
    nome: string,
  ): Promise<AmbienteRespostaDto> {
    await this.buscar(id, usuarioId);
    await this.tratandoNomeEmUso(() =>
      this.ambientes.renomear(id, usuarioId, nome),
    );
    return { id, nome };
  }

  async remover(id: number, usuarioId: number): Promise<void> {
    await this.buscar(id, usuarioId);
    const removido = await this.ambientes.removerSeSemDispositivos(id, usuarioId);
    if (!removido) {
      throw new ConflictException({
        codigo: 'AMBIENTE_COM_DISPOSITIVOS',
        mensagem:
          'Este ambiente ainda tem dispositivos. Remova-os ou mude-os de cômodo antes de excluí-lo.',
      });
    }
  }

  private async buscar(id: number, usuarioId: number): Promise<Ambiente> {
    const ambiente = await this.ambientes.buscarPorId(id, usuarioId);
    if (!ambiente) {
      throw new NotFoundException({ mensagem: 'Ambiente não encontrado.' });
    }
    return ambiente;
  }

  private async tratandoNomeEmUso<T>(operacao: () => Promise<T>): Promise<T> {
    try {
      return await operacao();
    } catch (erro) {
      if (erro instanceof RegistroDuplicadoError) {
        throw new ConflictException({
          codigo: 'AMBIENTE_DUPLICADO',
          mensagem: 'Você já tem um ambiente com este nome.',
        });
      }
      throw erro;
    }
  }
}
