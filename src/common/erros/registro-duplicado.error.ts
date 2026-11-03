export class RegistroDuplicadoError extends Error {
  constructor() {
    super('Registro duplicado');
    this.name = 'RegistroDuplicadoError';
  }
}

const CODIGO_UNIQUE_VIOLATION = '23505';

export function ehViolacaoDeUnicidade(erro: unknown): boolean {
  const driverError = (erro as { driverError?: { code?: string } }).driverError;
  return driverError?.code === CODIGO_UNIQUE_VIOLATION;
}
