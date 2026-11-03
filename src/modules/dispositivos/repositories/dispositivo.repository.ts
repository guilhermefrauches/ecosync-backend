import type { Dispositivo, TipoDispositivo } from '../entities/dispositivo.entity.js';

export interface DadosDispositivo {
  nome: string;
  tipo: TipoDispositivo;
  potenciaWatts: number;
  ambienteId: number;
}

export abstract class DispositivoRepository {
  abstract criar(dados: DadosDispositivo): Promise<Dispositivo>;
  abstract listar(usuarioId: number): Promise<Dispositivo[]>;
  abstract buscarPorId(id: number, usuarioId: number): Promise<Dispositivo | null>;
  abstract buscarComLock(id: number, usuarioId: number): Promise<Dispositivo | null>;
  abstract atualizar(
    id: number,
    dados: Partial<DadosDispositivo> & { statusAtual?: boolean },
  ): Promise<void>;
  abstract remover(id: number): Promise<void>;
}
