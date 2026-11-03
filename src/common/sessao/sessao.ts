import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';

export const CHAVE_ROTA_PUBLICA = 'rota-publica';

export const Public = () => SetMetadata(CHAVE_ROTA_PUBLICA, true);

export interface UsuarioSessao {
  id: number;
}

export type RequisicaoComSessao = Request & { usuario?: UsuarioSessao };

export const UsuarioAtual = createParamDecorator(
  (_dados: unknown, contexto: ExecutionContext): UsuarioSessao => {
    const requisicao = contexto.switchToHttp().getRequest<RequisicaoComSessao>();
    return requisicao.usuario as UsuarioSessao;
  },
);
