import { Module } from '@nestjs/common';
import { HistoricoModule } from '../historico/historico.module.js';
import { CalculadoraDashboard } from './calculadora-dashboard.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [HistoricoModule],
  controllers: [DashboardController],
  providers: [DashboardService, CalculadoraDashboard],
})
export class DashboardModule {}
