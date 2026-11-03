import { Controller, Get, Query } from '@nestjs/common';
import {
  UsuarioAtual,
  type UsuarioSessao,
} from '../../common/sessao/sessao.js';
import { ConsultarHistoricoDto, type PaginaHistoricoDto } from './dto/historico.dto.js';
import { HistoricoService } from './historico.service.js';

@Controller('historico')
export class HistoricoController {
  constructor(private readonly historico: HistoricoService) {}

  @Get()
  listar(
    @UsuarioAtual() sessao: UsuarioSessao,
    @Query() filtro: ConsultarHistoricoDto,
  ): Promise<PaginaHistoricoDto> {
    return this.historico.listar(sessao.id, filtro);
  }
}
