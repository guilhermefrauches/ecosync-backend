import type { Dia } from '../../../common/fuso-horario.js';
import type { TipoDispositivo } from '../../dispositivos/entities/dispositivo.entity.js';

export interface ConsumoDispositivo {
  dispositivoId: number;
  nome: string;
  comodo: string;
  potenciaWatts: number;
  kwh: number;
}

export interface ConsumoDiario {
  dia: Dia;
  tipo: TipoDispositivo;
  comodo: string;
  kwh: number;
}

export abstract class ConsumoRepository {
  abstract porDispositivoAtivo(
    usuarioId: number,
    inicio: Date,
    agora: Date,
  ): Promise<ConsumoDispositivo[]>;

  abstract porDia(
    usuarioId: number,
    primeiroDia: Dia,
    ultimoDia: Dia,
    agora: Date,
  ): Promise<ConsumoDiario[]>;

  abstract primeiroUso(usuarioId: number): Promise<Date | null>;
}
