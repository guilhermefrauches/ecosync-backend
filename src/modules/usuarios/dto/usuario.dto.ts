import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Texto } from '../../../common/validacao/texto.decorator.js';
import type { Usuario } from '../entities/usuario.entity.js';

export function Email(): PropertyDecorator {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim().toLowerCase() : value,
    ),
    IsEmail({}, { message: 'Informe um e-mail válido.' }),
    MaxLength(100, { message: 'O e-mail deve ter no máximo 100 caracteres.' }),
  );
}

function SenhaNova(): PropertyDecorator {
  return applyDecorators(
    IsString({ message: 'A senha deve ser um texto.' }),
    MinLength(6, { message: 'A senha precisa ter pelo menos 6 caracteres.' }),
    MaxLength(128, { message: 'A senha deve ter no máximo 128 caracteres.' }),
  );
}

export function SenhaInformada(): PropertyDecorator {
  return applyDecorators(
    IsString({ message: 'Informe a senha.' }),
    IsNotEmpty({ message: 'Informe a senha.' }),
    MaxLength(128, { message: 'A senha deve ter no máximo 128 caracteres.' }),
  );
}

const SeEnviado = () => ValidateIf((_objeto, valor) => valor !== undefined);

export class CriarUsuarioDto {
  @Texto('O nome', 100)
  nome!: string;

  @Email()
  email!: string;

  @SenhaNova()
  senha!: string;
}

export class AtualizarUsuarioDto {
  @SeEnviado()
  @Texto('O nome', 100)
  nome?: string;

  @SeEnviado()
  @Email()
  email?: string;

  @SeEnviado()
  @SenhaInformada()
  senhaAtual?: string;

  @SeEnviado()
  @SenhaNova()
  novaSenha?: string;
}

export class RemoverUsuarioDto {
  @SenhaInformada()
  senha!: string;
}

export class UsuarioRespostaDto {
  id!: number;
  nome!: string;
  email!: string;

  static de(usuario: Usuario): UsuarioRespostaDto {
    return { id: usuario.id, nome: usuario.nome, email: usuario.email };
  }
}
