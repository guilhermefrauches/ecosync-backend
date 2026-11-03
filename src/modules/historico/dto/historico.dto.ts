import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, Matches, Max, Min } from 'class-validator';
import { MAIOR_ID } from '../../../common/validacao/parse-id.pipe.js';
import type { HistoricoUso } from '../entities/historico-uso.entity.js';

const DATA_OU_INSTANTE =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2}))?$/;
const MENSAGEM_DATA =
  'deve ser uma data (AAAA-MM-DD) ou um instante com fuso (ex.: 2026-10-29T18:00:00-03:00).';

export class ConsultarHistoricoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'dispositivoId deve ser um número inteiro.' })
  @Min(1, { message: 'dispositivoId deve ser positivo.' })
  @Max(MAIOR_ID, { message: 'dispositivoId é inválido.' })
  dispositivoId?: number;

  @IsOptional()
  @Matches(DATA_OU_INSTANTE, { message: `de ${MENSAGEM_DATA}` })
  @IsISO8601({ strict: true }, { message: `de ${MENSAGEM_DATA}` })
  de?: string;

  @IsOptional()
  @Matches(DATA_OU_INSTANTE, { message: `ate ${MENSAGEM_DATA}` })
  @IsISO8601({ strict: true }, { message: `ate ${MENSAGEM_DATA}` })
  ate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pagina deve ser um número inteiro.' })
  @Min(1, { message: 'pagina deve ser pelo menos 1.' })
  @Max(MAIOR_ID, { message: 'pagina é inválida.' })
  pagina: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limite deve ser um número inteiro.' })
  @Min(1, { message: 'limite deve ser pelo menos 1.' })
  @Max(100, { message: 'limite deve ser no máximo 100.' })
  limite: number = 20;
}

export class RegistroHistoricoDto {
  id!: number;
  dispositivoId!: number;
  dispositivoNome!: string;
  comodo!: string;
  ligadoEm!: Date;
  desligadoEm!: Date | null;
  consumoKwh!: number | null;

  static de(registro: HistoricoUso): RegistroHistoricoDto {
    const dispositivo = registro.dispositivo!;
    return {
      id: registro.id,
      dispositivoId: registro.dispositivoId,
      dispositivoNome: dispositivo.nome,
      comodo: dispositivo.ambiente.nome,
      ligadoEm: registro.dataHoraLigado,
      desligadoEm: registro.dataHoraDesligado,
      consumoKwh: registro.consumoKwh,
    };
  }
}

export class PaginaHistoricoDto {
  itens!: RegistroHistoricoDto[];
  pagina!: number;
  limite!: number;
  total!: number;
  totalPaginas!: number;
}
