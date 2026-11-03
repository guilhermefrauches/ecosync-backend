import { Controller, Get } from '@nestjs/common';
import {
  UsuarioAtual,
  type UsuarioSessao,
} from '../../common/sessao/sessao.js';
import { DashboardService } from './dashboard.service.js';
import type { DashboardDto } from './dto/dashboard.dto.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  obter(@UsuarioAtual() sessao: UsuarioSessao): Promise<DashboardDto> {
    return this.dashboard.obter(sessao.id);
  }
}
