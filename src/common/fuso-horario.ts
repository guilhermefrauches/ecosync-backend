export const FUSO_HORARIO = 'America/Sao_Paulo';

export type Dia = string;

const formatador = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_HORARIO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function partes(instante: Date): Record<string, number> {
  const valores: Record<string, number> = {};
  for (const { type, value } of formatador.formatToParts(instante)) {
    valores[type] = Number(value);
  }
  return valores;
}

function comoUtc(dia: Dia): Date {
  return new Date(`${dia}T00:00:00Z`);
}

function paraDia(data: Date): Dia {
  return data.toISOString().slice(0, 10);
}

export function diaDe(instante: Date): Dia {
  const p = partes(instante);
  return paraDia(new Date(Date.UTC(p.year, p.month - 1, p.day)));
}

export function inicioDoDia(dia: Dia): Date {
  const utc = comoUtc(dia).getTime();
  const deslocamento = (instante: number) => {
    const p = partes(new Date(instante));
    const local = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return local - Math.floor(instante / 1000) * 1000;
  };
  const palpite = utc - deslocamento(utc);
  return new Date(utc - deslocamento(palpite));
}

export function somarDias(dia: Dia, dias: number): Dia {
  const data = comoUtc(dia);
  data.setUTCDate(data.getUTCDate() + dias);
  return paraDia(data);
}

export function primeiroDiaDoMes(dia: Dia, deslocamentoMeses = 0): Dia {
  const data = comoUtc(dia);
  return paraDia(
    new Date(
      Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + deslocamentoMeses, 1),
    ),
  );
}

export function segundaDaSemana(dia: Dia): Dia {
  const diaDaSemana = comoUtc(dia).getUTCDay();
  return somarDias(dia, -((diaDaSemana + 6) % 7));
}
