import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { inicioDoDia, somarDias } from '../../common/fuso-horario.js';
import {
  type ConsultarHistoricoDto,
  type PaginaHistoricoDto,
  RegistroHistoricoDto,
} from './dto/historico.dto.js';
import { HistoricoRepository } from './repositories/historico.repository.js';

const SO_DATA = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class HistoricoService {
  constructor(private readonly historico: HistoricoRepository) {}

  async listar(
    usuarioId: number,
    filtro: ConsultarHistoricoDto,
  ): Promise<PaginaHistoricoDto> {
    const de = this.inicioDoIntervalo(filtro.de);
    const ate = this.fimDoIntervalo(filtro.ate);
    if (de && ate && de >= ate) {
      throw new BadRequestException({
        codigo: 'VALIDACAO',
        mensagem: 'A data inicial deve ser anterior à data final.',
      });
    }

    const { dispositivoId, pagina, limite } = filtro;
    if (
      dispositivoId !== undefined &&
      !(await this.historico.usuarioPossuiDispositivo(usuarioId, dispositivoId))
    ) {
      throw new NotFoundException({ mensagem: 'Dispositivo não encontrado.' });
    }

    const { itens, total } = await this.historico.listar({
      usuarioId,
      dispositivoId,
      de,
      ate,
      pagina,
      limite,
    });
    return {
      itens: itens.map((registro) => RegistroHistoricoDto.de(registro)),
      pagina,
      limite,
      total,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  private inicioDoIntervalo(valor?: string): Date | undefined {
    if (!valor) return undefined;
    return SO_DATA.test(valor) ? inicioDoDia(valor) : new Date(valor);
  }

  private fimDoIntervalo(valor?: string): Date | undefined {
    if (!valor) return undefined;
    return SO_DATA.test(valor) ? inicioDoDia(somarDias(valor, 1)) : new Date(valor);
  }
}
