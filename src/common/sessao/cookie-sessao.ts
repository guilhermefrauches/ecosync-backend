import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import type { Env } from '../../config/env.validation.js';

export const NOME_COOKIE_SESSAO = 'ecosync_sessao';
export const VALIDADE_SESSAO_SEGUNDOS = 7 * 24 * 60 * 60;

@Injectable()
export class CookieSessao {
  constructor(private readonly config: ConfigService<Env, true>) {}

  gravar(resposta: Response, token: string): void {
    resposta.cookie(NOME_COOKIE_SESSAO, token, {
      ...this.opcoes(),
      maxAge: VALIDADE_SESSAO_SEGUNDOS * 1000,
    });
  }

  apagar(resposta: Response): void {
    resposta.clearCookie(NOME_COOKIE_SESSAO, this.opcoes());
  }

  private opcoes(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      path: '/',
    };
  }
}
