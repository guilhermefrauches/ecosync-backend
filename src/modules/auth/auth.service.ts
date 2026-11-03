import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioRespostaDto } from '../usuarios/dto/usuario.dto.js';
import { HasherSenha } from '../usuarios/hasher-senha.js';
import { UsuarioRepository } from '../usuarios/repositories/usuario.repository.js';
import type { LoginDto } from './dto/login.dto.js';

export interface SessaoCriada {
  token: string;
  usuario: UsuarioRespostaDto;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: HasherSenha,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<SessaoCriada> {
    const usuario = await this.usuarios.buscarPorEmail(dto.email);
    if (!usuario || !(await this.hasher.confere(usuario.senha, dto.senha))) {
      throw new UnauthorizedException({
        codigo: 'CREDENCIAIS_INVALIDAS',
        mensagem: 'E-mail ou senha inválidos.',
      });
    }
    const token = await this.jwt.signAsync({ sub: String(usuario.id) });
    return { token, usuario: UsuarioRespostaDto.de(usuario) };
  }
}
