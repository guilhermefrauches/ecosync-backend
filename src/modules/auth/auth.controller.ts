import { Body, Controller, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { CookieSessao } from '../../common/sessao/cookie-sessao.js';
import { Public } from '../../common/sessao/sessao.js';
import type { UsuarioRespostaDto } from '../usuarios/dto/usuario.dto.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookie: CookieSessao,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) resposta: Response,
  ): Promise<UsuarioRespostaDto> {
    const { token, usuario } = await this.auth.login(dto);
    this.cookie.gravar(resposta, token);
    return usuario;
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) resposta: Response): void {
    this.cookie.apagar(resposta);
  }
}
