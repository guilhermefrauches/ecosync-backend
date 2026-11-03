import type { Ambiente } from '../entities/ambiente.entity.js';

export abstract class AmbienteRepository {
  abstract criar(usuarioId: number, nome: string): Promise<Ambiente>;
  abstract listar(usuarioId: number): Promise<Ambiente[]>;
  abstract buscarPorId(id: number, usuarioId: number): Promise<Ambiente | null>;
  abstract renomear(id: number, usuarioId: number, nome: string): Promise<void>;
  abstract removerSeSemDispositivos(id: number, usuarioId: number): Promise<boolean>;
  abstract encontrarOuCriar(usuarioId: number, nome: string): Promise<Ambiente>;
}
