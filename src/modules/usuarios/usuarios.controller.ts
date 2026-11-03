import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CookieSessao } from '../../common/sessao/cookie-sessao.js';
import {
  Public,
  UsuarioAtual,
  type UsuarioSessao,
} from '../../common/sessao/sessao.js';
import {
  AtualizarUsuarioDto,
  CriarUsuarioDto,
  RemoverUsuarioDto,
  UsuarioRespostaDto,
} from './dto/usuario.dto.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly cookie: CookieSessao,
  ) {}

  @Public()
  @Post()
  cadastrar(@Body() dto: CriarUsuarioDto): Promise<UsuarioRespostaDto> {
    return this.usuarios.cadastrar(dto);
  }

  @Get('me')
  obter(@UsuarioAtual() sessao: UsuarioSessao): Promise<UsuarioRespostaDto> {
    return this.usuarios.obter(sessao.id);
  }

  @Patch('me')
  atualizar(
    @UsuarioAtual() sessao: UsuarioSessao,
    @Body() dto: AtualizarUsuarioDto,
  ): Promise<UsuarioRespostaDto> {
    return this.usuarios.atualizar(sessao.id, dto);
  }

  @Delete('me')
  @HttpCode(204)
  async remover(
    @UsuarioAtual() sessao: UsuarioSessao,
    @Body() dto: RemoverUsuarioDto,
    @Res({ passthrough: true }) resposta: Response,
  ): Promise<void> {
    await this.usuarios.remover(sessao.id, dto.senha);
    this.cookie.apagar(resposta);
  }
}
