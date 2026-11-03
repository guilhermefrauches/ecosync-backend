import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegistroDuplicadoError } from '../../common/erros/registro-duplicado.error.js';
import { Relogio } from '../../common/relogio/relogio.js';
import {
  type AtualizarUsuarioDto,
  type CriarUsuarioDto,
  UsuarioRespostaDto,
} from './dto/usuario.dto.js';
import type { Usuario } from './entities/usuario.entity.js';
import { HasherSenha } from './hasher-senha.js';
import { type NovoUsuario, UsuarioRepository } from './repositories/usuario.repository.js';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: HasherSenha,
    private readonly relogio: Relogio,
  ) {}

  async cadastrar(dto: CriarUsuarioDto): Promise<UsuarioRespostaDto> {
    const senha = await this.hasher.gerarHash(dto.senha);
    const usuario = await this.tratandoEmailEmUso(() =>
      this.usuarios.criar({ nome: dto.nome, email: dto.email, senha }),
    );
    return UsuarioRespostaDto.de(usuario);
  }

  async obter(id: number): Promise<UsuarioRespostaDto> {
    return UsuarioRespostaDto.de(await this.buscar(id));
  }

  async atualizar(
    id: number,
    dto: AtualizarUsuarioDto,
  ): Promise<UsuarioRespostaDto> {
    const usuario = await this.buscar(id);
    const dados: Partial<NovoUsuario> = {};
    if (dto.nome !== undefined) dados.nome = dto.nome;
    if (dto.email !== undefined) dados.email = dto.email;
    if (dto.novaSenha !== undefined) {
      if (dto.senhaAtual === undefined) {
        throw new BadRequestException({
          codigo: 'VALIDACAO',
          mensagem: 'Informe a senha atual para trocar de senha.',
        });
      }
      await this.exigirSenhaCorreta(usuario, dto.senhaAtual);
      dados.senha = await this.hasher.gerarHash(dto.novaSenha);
    }

    if (Object.keys(dados).length > 0) {
      await this.tratandoEmailEmUso(() => this.usuarios.atualizar(id, dados));
    }
    return UsuarioRespostaDto.de(Object.assign(usuario, dados));
  }

  async remover(id: number, senha: string): Promise<void> {
    await this.exigirSenhaCorreta(await this.buscar(id), senha);
    await this.usuarios.removerComDados(id, this.relogio.agora());
  }

  private async buscar(id: number): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) {
      throw new UnauthorizedException({
        mensagem: 'Faça login para continuar.',
      });
    }
    return usuario;
  }

  private async exigirSenhaCorreta(usuario: Usuario, senha: string): Promise<void> {
    if (!(await this.hasher.confere(usuario.senha, senha))) {
      throw new BadRequestException({
        codigo: 'SENHA_INCORRETA',
        mensagem: 'A senha atual está incorreta.',
      });
    }
  }

  private async tratandoEmailEmUso<T>(operacao: () => Promise<T>): Promise<T> {
    try {
      return await operacao();
    } catch (erro) {
      if (erro instanceof RegistroDuplicadoError) {
        throw new ConflictException({
          codigo: 'EMAIL_EM_USO',
          mensagem: 'Este e-mail já está em uso.',
        });
      }
      throw erro;
    }
  }
}
