import type { ValueTransformer } from 'typeorm';

export const numericTransformer: ValueTransformer = {
  to: (valor?: number | null) => valor,
  from: (valor?: string | null) =>
    valor === null || valor === undefined ? null : Number(valor),
};
