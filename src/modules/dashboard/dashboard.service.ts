import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { diaDe } from '../../common/fuso-horario.js';
import { Relogio } from '../../common/relogio/relogio.js';
import type { Env } from '../../config/env.validation.js';
import { ConsumoRepository } from '../historico/repositories/consumo.repository.js';
import { CalculadoraDashboard } from './calculadora-dashboard.js';
import type { DashboardDto } from './dto/dashboard.dto.js';

const MS_EM_7_DIAS = 7 * 86_400_000;

@Injectable()
export class DashboardService {
  constructor(
    private readonly consumo: ConsumoRepository,
    private readonly calculadora: CalculadoraDashboard,
    private readonly relogio: Relogio,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async obter(usuarioId: number): Promise<DashboardDto> {
    const agora = this.relogio.agora();
    const [primeiroUso, consumoDiario, consumo7Dias] = await Promise.all([
      this.consumo.primeiroUso(usuarioId),
      this.consumo.porDia(
        usuarioId,
        this.calculadora.primeiroDiaNecessario(agora),
        diaDe(agora),
        agora,
      ),
      this.consumo.porDispositivoAtivo(
        usuarioId,
        new Date(agora.getTime() - MS_EM_7_DIAS),
        agora,
      ),
    ]);

    return this.calculadora.calcular({
      agora,
      primeiroUso,
      consumoDiario,
      consumo7Dias,
      tarifaKwh: this.config.get('TARIFA_KWH', { infer: true }),
    });
  }
}
