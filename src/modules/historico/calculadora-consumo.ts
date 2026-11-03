import { Injectable } from '@nestjs/common';

const MS_POR_HORA = 3_600_000;

export function arredondar(valor: number, casas: number): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

@Injectable()
export class CalculadoraConsumo {
  kwhDaSessao(potenciaWatts: number, ligadoEm: Date, desligadoEm: Date): number {
    const horas = (desligadoEm.getTime() - ligadoEm.getTime()) / MS_POR_HORA;
    return arredondar((potenciaWatts * horas) / 1000, 4);
  }

  instanteDeFechamento(ligadoEm: Date, agora: Date): Date {
    return agora > ligadoEm ? agora : new Date(ligadoEm.getTime() + 1);
  }

  mediaDiaria(kwhNoPeriodo: number, dias: number): number {
    return arredondar(kwhNoPeriodo / dias, 2);
  }
}
