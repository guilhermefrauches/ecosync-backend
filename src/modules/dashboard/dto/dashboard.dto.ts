export interface IndicadorDto {
  valor: number | null;
  variacao: number | null;
}

export interface ConsumoSemanaDto {
  dia: string;
  real: number | null;
  previsto: number | null;
}

export interface ConsumoPorTipoDto {
  nome: string;
  valor: number;
}

export interface ConsumoPorComodoDto {
  comodo: string;
  kwh: number;
}

export interface RecomendacaoDto {
  titulo: string;
  texto: string;
}

export interface DashboardDto {
  resumo: {
    consumoHoje: IndicadorDto;
    custoMes: IndicadorDto;
    economiaMes: IndicadorDto;
  };
  consumoSemana: ConsumoSemanaDto[];
  consumoPorTipo: ConsumoPorTipoDto[] | null;
  consumoPorComodo: ConsumoPorComodoDto[] | null;
  recomendacao: RecomendacaoDto | null;
}
