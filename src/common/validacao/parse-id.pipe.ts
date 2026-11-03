import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export const MAIOR_ID = 2147483647;

@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(valor: string): number {
    const id = /^\d{1,10}$/.test(valor) ? Number(valor) : 0;
    if (id < 1 || id > MAIOR_ID) {
      throw new BadRequestException({
        codigo: 'VALIDACAO',
        mensagem: 'O identificador informado é inválido.',
      });
    }
    return id;
  }
}
