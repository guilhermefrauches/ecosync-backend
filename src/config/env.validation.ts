import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export class Env {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: 'development' | 'test' | 'production' = 'development';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORTA: number = 3000;

  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORTA!: number;

  @IsString()
  @IsNotEmpty()
  DB_USUARIO!: string;

  @IsString()
  @IsNotEmpty()
  DB_SENHA!: string;

  @IsString()
  @IsNotEmpty()
  DB_NOME!: string;

  @IsString()
  @MinLength(32)
  JWT_SEGREDO!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  TARIFA_KWH!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  LOGIN_LIMITE_POR_MINUTO: number = 10;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  CONFIAR_NO_PROXY: boolean = false;
}

export function validarEnv(config: Record<string, unknown>): Env {
  const env = plainToInstance(Env, config);
  const erros = validateSync(env);
  if (erros.length > 0) {
    const variaveis = erros.map((erro) => erro.property).join(', ');
    throw new Error(`Variáveis de ambiente ausentes ou inválidas: ${variaveis}`);
  }
  return env;
}
