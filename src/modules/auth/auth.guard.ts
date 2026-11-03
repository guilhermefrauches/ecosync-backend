import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { NOME_COOKIE_SESSAO } from '../../common/sessao/cookie-sessao.js';
import {
  CHAVE_ROTA_PUBLICA,
  type RequisicaoComSessao,
} from '../../common/sessao/sessao.js';
import { UsuarioRepository } from '../usuarios/repositories/usuario.repository.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly usuarios: UsuarioRepository,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const rotaPublica = this.reflector.getAllAndOverride<boolean>(
      CHAVE_ROTA_PUBLICA,
      [contexto.getHandler(), contexto.getClass()],
    );
    if (rotaPublica) return true;

    const requisicao = contexto.switchToHttp().getRequest<RequisicaoComSessao>();
    const id = await this.usuarioDoToken(requisicao);
    if (id === null || !(await this.usuarios.buscarPorId(id))) {
      throw new UnauthorizedException({
        mensagem: 'Faça login para continuar.',
      });
    }
    requisicao.usuario = { id };
    return true;
  }

  private async usuarioDoToken(
    requisicao: RequisicaoComSessao,
  ): Promise<number | null> {
    const cookies = requisicao.cookies as Record<string, unknown>;
    const token = cookies[NOME_COOKIE_SESSAO];
    if (typeof token !== 'string') return null;
    try {
      const { sub } = await this.jwt.verifyAsync<{ sub: string }>(token);
      const id = Number(sub);
      return Number.isInteger(id) ? id : null;
    } catch {
      return null;
    }
  }
}
