import type { Usuario } from '../entities/usuario.entity.js';

export interface NovoUsuario {
  nome: string;
  email: string;
  senha: string;
}

export abstract class UsuarioRepository {
  abstract criar(dados: NovoUsuario): Promise<Usuario>;
  abstract buscarPorId(id: number): Promise<Usuario | null>;
  abstract buscarPorEmail(email: string): Promise<Usuario | null>;
  abstract atualizar(id: number, dados: Partial<NovoUsuario>): Promise<void>;
  abstract removerComDados(id: number, agora: Date): Promise<void>;
}
