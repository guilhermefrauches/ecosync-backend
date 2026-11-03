import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  UsuarioAtual,
  type UsuarioSessao,
} from '../../common/sessao/sessao.js';
import { ParseIdPipe } from '../../common/validacao/parse-id.pipe.js';
import { DispositivosService } from './dispositivos.service.js';
import {
  AlterarEstadoDto,
  type DispositivoRespostaDto,
  SalvarDispositivoDto,
} from './dto/dispositivo.dto.js';

@Controller('dispositivos')
export class DispositivosController {
  constructor(private readonly dispositivos: DispositivosService) {}

  @Post()
  criar(
    @UsuarioAtual() sessao: UsuarioSessao,
    @Body() dto: SalvarDispositivoDto,
  ): Promise<DispositivoRespostaDto> {
    return this.dispositivos.criar(sessao.id, dto);
  }

  @Get()
  listar(@UsuarioAtual() sessao: UsuarioSessao): Promise<DispositivoRespostaDto[]> {
    return this.dispositivos.listar(sessao.id);
  }

  @Get(':id')
  obter(
    @UsuarioAtual() sessao: UsuarioSessao,
    @Param('id', ParseIdPipe) id: number,
  ): Promise<DispositivoRespostaDto> {
    return this.dispositivos.obter(id, sessao.id);
  }

  @Put(':id')
  atualizar(
    @UsuarioAtual() sessao: UsuarioSessao,
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: SalvarDispositivoDto,
  ): Promise<DispositivoRespostaDto> {
    return this.dispositivos.atualizar(id, sessao.id, dto);
  }

  @Patch(':id/estado')
  alterarEstado(
    @UsuarioAtual() sessao: UsuarioSessao,
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: AlterarEstadoDto,
  ): Promise<DispositivoRespostaDto> {
    return this.dispositivos.alterarEstado(id, sessao.id, dto.ligado);
  }

  @Delete(':id')
  @HttpCode(204)
  remover(
    @UsuarioAtual() sessao: UsuarioSessao,
    @Param('id', ParseIdPipe) id: number,
  ): Promise<void> {
    return this.dispositivos.remover(id, sessao.id);
  }
}
