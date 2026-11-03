import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, NotContains } from 'class-validator';

export function Texto(rotulo: string, maximo: number): PropertyDecorator {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    ),
    IsString({ message: `${rotulo} deve ser um texto.` }),
    IsNotEmpty({ message: `${rotulo} é obrigatório.` }),
    MaxLength(maximo, {
      message: `${rotulo} deve ter no máximo ${maximo} caracteres.`,
    }),
    NotContains('\0', { message: `${rotulo} contém caracteres inválidos.` }),
  );
}
