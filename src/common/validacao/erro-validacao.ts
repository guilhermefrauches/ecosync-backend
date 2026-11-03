import { BadRequestException, type ValidationError } from '@nestjs/common';

export function erroDeValidacao(erros: ValidationError[]): BadRequestException {
  const mensagens = erros.map((erro) => {
    const restricoes = erro.constraints ?? {};
    if (restricoes.whitelistValidation) {
      return `O campo "${erro.property}" não é permitido.`;
    }
    if (restricoes.unknownValue) return 'Corpo da requisição inválido.';
    return Object.values(restricoes)[0];
  });
  return new BadRequestException({
    codigo: 'VALIDACAO',
    mensagem: mensagens.join(' '),
  });
}
