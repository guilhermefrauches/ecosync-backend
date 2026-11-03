import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

const POR_STATUS: Record<number, { codigo: string; mensagem: string }> = {
  400: { codigo: 'REQUISICAO_INVALIDA', mensagem: 'Requisição inválida.' },
  401: { codigo: 'NAO_AUTENTICADO', mensagem: 'Faça login para continuar.' },
  404: { codigo: 'NAO_ENCONTRADO', mensagem: 'Recurso não encontrado.' },
  409: { codigo: 'CONFLITO', mensagem: 'A operação gerou um conflito.' },
  429: {
    codigo: 'MUITAS_TENTATIVAS',
    mensagem: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
  },
  500: {
    codigo: 'ERRO_INTERNO',
    mensagem: 'Erro interno. Tente novamente mais tarde.',
  },
};

@Catch()
export class FiltroErros implements ExceptionFilter {
  private readonly logger = new Logger(FiltroErros.name);

  catch(excecao: unknown, host: ArgumentsHost): void {
    const resposta = host.switchToHttp().getResponse<Response>();
    const status = this.statusDe(excecao);
    if (status === 500) {
      this.logger.error(
        excecao instanceof Error ? excecao.stack : String(excecao),
      );
    }

    const padrao = POR_STATUS[status] ?? POR_STATUS[status < 500 ? 400 : 500];
    const corpo =
      excecao instanceof HttpException ? excecao.getResponse() : null;
    const proprio = (typeof corpo === 'object' ? corpo : null) as {
      codigo?: string;
      mensagem?: string;
    } | null;

    resposta.status(status).json({
      erro: {
        codigo: proprio?.codigo ?? padrao.codigo,
        mensagem: proprio?.mensagem ?? padrao.mensagem,
      },
    });
  }

  private statusDe(excecao: unknown): number {
    if (excecao instanceof HttpException) return excecao.getStatus();
    const status = (excecao as { status?: unknown } | null)?.status;
    return typeof status === 'number' && status >= 400 && status < 500
      ? status
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
