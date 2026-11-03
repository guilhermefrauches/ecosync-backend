import { IsBoolean, IsIn, IsNumber, IsPositive, Max } from 'class-validator';
import { Texto } from '../../../common/validacao/texto.decorator.js';
import {
  type Dispositivo,
  TIPOS_DISPOSITIVO,
  type TipoDispositivo,
} from '../entities/dispositivo.entity.js';

const POTENCIA_MAXIMA_WATTS = 100_000;

export class SalvarDispositivoDto {
  @Texto('O nome', 50)
  nome!: string;

  @Texto('O cômodo', 50)
  comodo!: string;

  @IsIn(TIPOS_DISPOSITIVO, {
    message: `O tipo deve ser um destes: ${TIPOS_DISPOSITIVO.join(', ')}.`,
  })
  tipo!: TipoDispositivo;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'A potência deve ser um número com até 2 casas decimais.' },
  )
  @IsPositive({ message: 'A potência deve ser maior que zero.' })
  @Max(POTENCIA_MAXIMA_WATTS, {
    message: `A potência deve ser de no máximo ${POTENCIA_MAXIMA_WATTS} W.`,
  })
  potenciaWatts!: number;
}

export class AlterarEstadoDto {
  @IsBoolean({ message: 'O campo "ligado" deve ser verdadeiro ou falso.' })
  ligado!: boolean;
}

export class DispositivoRespostaDto {
  id!: number;
  nome!: string;
  comodo!: string;
  ambienteId!: number;
  tipo!: TipoDispositivo;
  ligado!: boolean;
  potenciaWatts!: number;
  consumo!: number;

  static de(dispositivo: Dispositivo, consumo: number): DispositivoRespostaDto {
    return {
      id: dispositivo.id,
      nome: dispositivo.nome,
      comodo: dispositivo.ambiente.nome,
      ambienteId: dispositivo.ambienteId,
      tipo: dispositivo.tipo,
      ligado: dispositivo.statusAtual,
      potenciaWatts: dispositivo.potenciaWatts,
      consumo,
    };
  }
}
