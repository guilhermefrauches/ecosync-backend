import type { HistoricoUso } from '../entities/historico-uso.entity.js';

export interface FiltroHistorico {
  usuarioId: number;
  dispositivoId?: number;
  de?: Date;
  ate?: Date;
  pagina: number;
  limite: number;
}

export abstract class HistoricoRepository {
  abstract abrirSessao(dispositivoId: number, ligadoEm: Date): Promise<void>;
  abstract buscarSessaoAberta(dispositivoId: number): Promise<HistoricoUso | null>;
  abstract fecharSessao(id: number, desligadoEm: Date, consumoKwh: number): Promise<void>;
  abstract listar(filtro: FiltroHistorico): Promise<{ itens: HistoricoUso[]; total: number }>;
  abstract usuarioPossuiDispositivo(usuarioId: number, dispositivoId: number): Promise<boolean>;
}
