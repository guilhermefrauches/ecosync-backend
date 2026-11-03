import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  UsuarioAtual,
  type UsuarioSessao,
} from '../../common/sessao/sessao.js';
import { ParseIdPipe } from '../../common/validacao/parse-id.pipe.js';
import { AmbientesService } from './ambientes.service.js';
import { type AmbienteRespostaDto, SalvarAmbienteDto } from './dto/ambiente.dto.js';

@Controller('ambientes')
export class AmbientesController {
  constructor(private readonly ambientes: AmbientesService) {}

  @Post()
  criar(
    @UsuarioAtual() sessao: UsuarioSessao,
    @Body() dto: SalvarAmbienteDto,
  ): Promise<AmbienteRespostaDto> {
    return this.ambientes.criar(sessao.id, dto.nome);
  }

  @Get()
  listar(@UsuarioAtual() sessao: UsuarioSessao): Promise<AmbienteRespostaDto[]> {
    return this.ambientes.listar(sessao.id);
  }

  @Get(':id')
  obter(
    @UsuarioAtual() sessao: UsuarioSessao,
    @Param('id', ParseIdPipe) id: number,
  ): Promise<AmbienteRespostaDto> {
    return this.ambientes.obter(id, sessao.id);
  }

  @Patch(':id')
  renomear(
    @UsuarioAtual() sessao: UsuarioSessao,
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: SalvarAmbienteDto,
  ): Promise<AmbienteRespostaDto> {
    return this.ambientes.renomear(id, sessao.id, dto.nome);
  }

  @Delete(':id')
  @HttpCode(204)
  remover(
    @UsuarioAtual() sessao: UsuarioSessao,
    @Param('id', ParseIdPipe) id: number,
  ): Promise<void> {
    return this.ambientes.remover(id, sessao.id);
  }
}
