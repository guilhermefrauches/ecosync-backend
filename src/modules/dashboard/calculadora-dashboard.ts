import { Injectable } from '@nestjs/common';
import {
  type Dia,
  diaDe,
  inicioDoDia,
  primeiroDiaDoMes,
  segundaDaSemana,
  somarDias,
} from '../../common/fuso-horario.js';
import type { TipoDispositivo } from '../dispositivos/entities/dispositivo.entity.js';
import { arredondar } from '../historico/calculadora-consumo.js';
import type {
  ConsumoDiario,
  ConsumoDispositivo,
} from '../historico/repositories/consumo.repository.js';
import type {
  ConsumoPorComodoDto,
  ConsumoPorTipoDto,
  ConsumoSemanaDto,
  DashboardDto,
  IndicadorDto,
  RecomendacaoDto,
} from './dto/dashboard.dto.js';

export interface EntradaDashboard {
  agora: Date;
  primeiroUso: Date | null;
  consumoDiario: ConsumoDiario[];
  consumo7Dias: ConsumoDispositivo[];
  tarifaKwh: number;
}

const DIAS_DA_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const NOMES_DOS_TIPOS: Record<TipoDispositivo, string> = {
  luz: 'Iluminação',
  climatizacao: 'Climatização',
  eletro: 'Eletrodomésticos',
  entretenimento: 'Entretenimento',
};
const SEMANAS_DA_PREVISAO = 4;
const MS_POR_DIA = 86_400_000;
const OBSERVACAO_MINIMA_MS = MS_POR_DIA;

@Injectable()
export class CalculadoraDashboard {
  primeiroDiaNecessario(agora: Date): Dia {
    const hoje = diaDe(agora);
    const inicioDaPrevisao = somarDias(
      segundaDaSemana(hoje),
      -7 * SEMANAS_DA_PREVISAO,
    );
    const mesRetrasado = primeiroDiaDoMes(hoje, -2);
    return inicioDaPrevisao < mesRetrasado ? inicioDaPrevisao : mesRetrasado;
  }

  calcular(entrada: EntradaDashboard): DashboardDto {
    return {
      resumo: {
        consumoHoje: this.consumoHoje(entrada),
        ...this.custoEEconomia(entrada),
      },
      consumoSemana: this.consumoSemana(entrada),
      consumoPorTipo: this.consumoPorTipo(entrada),
      consumoPorComodo: this.consumoPorComodo(entrada),
      recomendacao: this.recomendacao(entrada),
    };
  }

  private consumoHoje(entrada: EntradaDashboard): IndicadorDto {
    if (!entrada.primeiroUso) return { valor: null, variacao: null };
    const hoje = diaDe(entrada.agora);
    const ontem = somarDias(hoje, -1);
    const kwhHoje = this.kwhEntre(entrada, hoje, hoje);
    return {
      valor: arredondar(kwhHoje, 2),
      variacao: this.diaCoberto(entrada, ontem)
        ? this.variacao(kwhHoje, this.kwhEntre(entrada, ontem, ontem))
        : null,
    };
  }

  private custoEEconomia(entrada: EntradaDashboard): {
    custoMes: IndicadorDto;
    economiaMes: IndicadorDto;
  } {
    const { tarifaKwh } = entrada;
    const hoje = diaDe(entrada.agora);
    const projetado = this.projecaoDoMes(entrada);
    const custo = projetado === null ? null : projetado * tarifaKwh;
    const anterior = this.custoDoMesFechado(entrada, primeiroDiaDoMes(hoje, -1));
    const retrasado = this.custoDoMesFechado(entrada, primeiroDiaDoMes(hoje, -2));

    const economia =
      custo !== null && anterior !== null ? anterior - custo : null;
    const economiaAnterior =
      anterior !== null && retrasado !== null ? retrasado - anterior : null;

    return {
      custoMes: {
        valor: custo === null ? null : arredondar(custo, 2),
        variacao:
          custo !== null && anterior !== null
            ? this.variacao(custo, anterior)
            : null,
      },
      economiaMes: {
        valor: economia === null ? null : arredondar(economia, 2),
        variacao:
          economia !== null && economiaAnterior !== null
            ? this.variacao(economia, economiaAnterior)
            : null,
      },
    };
  }

  private projecaoDoMes(entrada: EntradaDashboard): number | null {
    const { agora, primeiroUso } = entrada;
    if (!primeiroUso) return null;

    const hoje = diaDe(agora);
    const primeiroDia = primeiroDiaDoMes(hoje);
    const inicioDoMes = inicioDoDia(primeiroDia).getTime();
    const fimDoMes = inicioDoDia(primeiroDiaDoMes(hoje, 1)).getTime();
    const observadoDesde = Math.max(inicioDoMes, primeiroUso.getTime());
    const observadoMs = agora.getTime() - observadoDesde;
    if (observadoMs < OBSERVACAO_MINIMA_MS) return null;

    const kwhDoMes = this.kwhEntre(entrada, primeiroDia, hoje);
    return (
      kwhDoMes + (kwhDoMes / observadoMs) * (fimDoMes - agora.getTime())
    );
  }

  private custoDoMesFechado(
    entrada: EntradaDashboard,
    primeiroDia: Dia,
  ): number | null {
    if (!this.diaCoberto(entrada, primeiroDia)) return null;
    const ultimoDia = somarDias(primeiroDiaDoMes(primeiroDia, 1), -1);
    return this.kwhEntre(entrada, primeiroDia, ultimoDia) * entrada.tarifaKwh;
  }

  private consumoSemana(entrada: EntradaDashboard): ConsumoSemanaDto[] {
    const hoje = diaDe(entrada.agora);
    const segunda = segundaDaSemana(hoje);
    return DIAS_DA_SEMANA.map((rotulo, indice) => {
      const dia = somarDias(segunda, indice);
      return {
        dia: rotulo,
        real: this.consumoRealDoDia(entrada, dia, hoje),
        previsto: this.previsaoDoDia(entrada, dia),
      };
    });
  }

  private consumoRealDoDia(
    entrada: EntradaDashboard,
    dia: Dia,
    hoje: Dia,
  ): number | null {
    const { primeiroUso } = entrada;
    if (!primeiroUso || dia > hoje || dia < diaDe(primeiroUso)) return null;
    return arredondar(this.kwhEntre(entrada, dia, dia), 2);
  }

  private previsaoDoDia(entrada: EntradaDashboard, dia: Dia): number | null {
    const maisAntigo = somarDias(dia, -7 * SEMANAS_DA_PREVISAO);
    if (!this.diaCoberto(entrada, maisAntigo)) return null;

    let total = 0;
    for (let semana = 1; semana <= SEMANAS_DA_PREVISAO; semana++) {
      const anterior = somarDias(dia, -7 * semana);
      total += this.kwhEntre(entrada, anterior, anterior);
    }
    return arredondar(total / SEMANAS_DA_PREVISAO, 2);
  }

  private consumoPorTipo(entrada: EntradaDashboard): ConsumoPorTipoDto[] | null {
    const consumoDeHoje = this.consumoDeHoje(entrada);
    const total = consumoDeHoje.reduce((soma, c) => soma + c.kwh, 0);
    if (total <= 0) return null;

    const porTipo = new Map<TipoDispositivo, number>();
    for (const { tipo, kwh } of consumoDeHoje) {
      porTipo.set(tipo, (porTipo.get(tipo) ?? 0) + kwh);
    }
    return [...porTipo]
      .sort(([, a], [, b]) => b - a)
      .map(([tipo, kwh]) => ({
        nome: NOMES_DOS_TIPOS[tipo],
        valor: arredondar((kwh / total) * 100, 1),
      }));
  }

  private consumoPorComodo(
    entrada: EntradaDashboard,
  ): ConsumoPorComodoDto[] | null {
    const porComodo = new Map<string, ConsumoPorComodoDto>();
    for (const { comodo, kwh } of this.consumoDeHoje(entrada)) {
      const chave = comodo.toLowerCase();
      const item = porComodo.get(chave) ?? { comodo, kwh: 0 };
      item.kwh += kwh;
      porComodo.set(chave, item);
    }
    const itens = [...porComodo.values()];
    if (!itens.some((item) => item.kwh > 0)) return null;
    return itens
      .sort((a, b) => b.kwh - a.kwh)
      .map((item) => ({ comodo: item.comodo, kwh: arredondar(item.kwh, 2) }));
  }

  private recomendacao(entrada: EntradaDashboard): RecomendacaoDto | null {
    const total = entrada.consumo7Dias.reduce((soma, c) => soma + c.kwh, 0);
    if (total <= 0) return null;

    const maior = entrada.consumo7Dias.reduce((a, b) => (b.kwh > a.kwh ? b : a));
    const media = maior.kwh / 7;
    const economia30Dias = media * 30 * 0.1;
    const numero = (valor: number) =>
      valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    const reais = (economia30Dias * entrada.tarifaKwh).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return {
      titulo: 'Dica do EcoSync',
      texto:
        `${maior.nome} (${maior.comodo}) foi o dispositivo que mais consumiu nos últimos ` +
        `7 dias: ${numero(media)} kWh/dia em média, ${numero((maior.kwh / total) * 100)}% do ` +
        `consumo da casa. Reduzir 10% do uso dele economizaria cerca de ` +
        `${numero(economia30Dias)} kWh (${reais}) a cada 30 dias.`,
    };
  }

  private consumoDeHoje(entrada: EntradaDashboard): ConsumoDiario[] {
    const hoje = diaDe(entrada.agora);
    return entrada.consumoDiario.filter((c) => c.dia === hoje);
  }

  private kwhEntre(entrada: EntradaDashboard, de: Dia, ate: Dia): number {
    return entrada.consumoDiario
      .filter((c) => c.dia >= de && c.dia <= ate)
      .reduce((soma, c) => soma + c.kwh, 0);
  }

  private diaCoberto(entrada: EntradaDashboard, dia: Dia): boolean {
    return (
      entrada.primeiroUso !== null && entrada.primeiroUso <= inicioDoDia(dia)
    );
  }

  private variacao(atual: number, base: number): number | null {
    if (base === 0) return null;
    return arredondar(((atual - base) / Math.abs(base)) * 100, 1);
  }
}
