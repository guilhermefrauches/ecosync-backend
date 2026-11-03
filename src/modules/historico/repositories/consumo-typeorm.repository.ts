import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { type Dia, FUSO_HORARIO } from '../../../common/fuso-horario.js';
import {
  type ConsumoDiario,
  type ConsumoDispositivo,
  ConsumoRepository,
} from './consumo.repository.js';

function kwhEntre(inicio: string, fim: string): string {
  const segundos = `EXTRACT(EPOCH FROM
      LEAST(${fim}, COALESCE(h.data_hora_desligado, ${fim}))
      - GREATEST(${inicio}, h.data_hora_ligado))`;
  return `CASE
      WHEN h.id IS NULL THEN 0
      WHEN h.data_hora_desligado IS NULL
        THEN d.potencia_watts / 1000 * ${segundos} / 3600
      ELSE h.consumo_kwh * ${segundos}
        / EXTRACT(EPOCH FROM h.data_hora_desligado - h.data_hora_ligado)
    END`;
}

@Injectable()
export class ConsumoTypeormRepository extends ConsumoRepository {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
  ) {
    super();
  }

  porDispositivoAtivo(
    usuarioId: number,
    inicio: Date,
    agora: Date,
  ): Promise<ConsumoDispositivo[]> {
    return this.manager.query(
      `SELECT d.id AS "dispositivoId",
              d.nome,
              a.nome AS comodo,
              d.potencia_watts::float8 AS "potenciaWatts",
              COALESCE(SUM(${kwhEntre('$2::timestamptz', '$3::timestamptz')}), 0)::float8 AS kwh
         FROM dispositivos d
         JOIN ambientes a ON a.id = d.ambiente_id
         LEFT JOIN historico_uso h
           ON h.dispositivo_id = d.id
          AND h.data_hora_ligado < $3::timestamptz
          AND COALESCE(h.data_hora_desligado, $3::timestamptz) > $2::timestamptz
        WHERE a.usuario_id = $1
          AND d.removido_em IS NULL
        GROUP BY d.id, a.nome`,
      [usuarioId, inicio, agora],
    );
  }

  porDia(
    usuarioId: number,
    primeiroDia: Dia,
    ultimoDia: Dia,
    agora: Date,
  ): Promise<ConsumoDiario[]> {
    return this.manager.query(
      `WITH dias AS (
         SELECT to_char(dia, 'YYYY-MM-DD') AS dia,
                dia AT TIME ZONE $5 AS inicio,
                LEAST((dia + interval '1 day') AT TIME ZONE $5, $4::timestamptz) AS fim
           FROM generate_series($2::timestamp, $3::timestamp, interval '1 day') AS dia
       )
       SELECT dias.dia,
              d.tipo,
              a.nome AS comodo,
              SUM(${kwhEntre('dias.inicio', 'dias.fim')})::float8 AS kwh
         FROM historico_uso h
         JOIN dispositivos d ON d.id = h.dispositivo_id
         JOIN ambientes a ON a.id = d.ambiente_id
         JOIN dias
           ON h.data_hora_ligado < dias.fim
          AND COALESCE(h.data_hora_desligado, $4::timestamptz) > dias.inicio
        WHERE a.usuario_id = $1
        GROUP BY dias.dia, d.tipo, a.id, a.nome`,
      [usuarioId, primeiroDia, ultimoDia, agora, FUSO_HORARIO],
    );
  }

  async primeiroUso(usuarioId: number): Promise<Date | null> {
    const [linha] = (await this.manager.query(
      `SELECT MIN(h.data_hora_ligado) AS inicio
         FROM historico_uso h
         JOIN dispositivos d ON d.id = h.dispositivo_id
         JOIN ambientes a ON a.id = d.ambiente_id
        WHERE a.usuario_id = $1`,
      [usuarioId],
    )) as { inicio: Date | null }[];
    return linha.inicio;
  }
}
