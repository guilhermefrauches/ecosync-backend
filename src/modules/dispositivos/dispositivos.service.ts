import { Injectable, NotFoundException } from '@nestjs/common';
import { Relogio } from '../../common/relogio/relogio.js';
import { CalculadoraConsumo } from '../historico/calculadora-consumo.js';
import { ConsumoRepository } from '../historico/repositories/consumo.repository.js';
import type { HistoricoRepository } from '../historico/repositories/historico.repository.js';
import {
  DispositivoRespostaDto,
  type SalvarDispositivoDto,
} from './dto/dispositivo.dto.js';
import type { Dispositivo } from './entities/dispositivo.entity.js';
import { DispositivoRepository } from './repositories/dispositivo.repository.js';
import { TransacaoDispositivos } from './repositories/transacao-dispositivos.js';

const DIAS_DA_MEDIA = 7;
const MS_POR_DIA = 86_400_000;

@Injectable()
export class DispositivosService {
  constructor(
    private readonly dispositivos: DispositivoRepository,
    private readonly consumo: ConsumoRepository,
    private readonly transacao: TransacaoDispositivos,
    private readonly calculadora: CalculadoraConsumo,
    private readonly relogio: Relogio,
  ) {}

  async criar(
    usuarioId: number,
    dto: SalvarDispositivoDto,
  ): Promise<DispositivoRespostaDto> {
    const id = await this.transacao.executar(async ({ ambientes, dispositivos }) => {
      const ambiente = await ambientes.encontrarOuCriar(usuarioId, dto.comodo);
      const criado = await dispositivos.criar({
        nome: dto.nome,
        tipo: dto.tipo,
        potenciaWatts: dto.potenciaWatts,
        ambienteId: ambiente.id,
      });
      return criado.id;
    });
    return this.obter(id, usuarioId);
  }

  async listar(usuarioId: number): Promise<DispositivoRespostaDto[]> {
    const [dispositivos, medias] = await Promise.all([
      this.dispositivos.listar(usuarioId),
      this.mediasDeConsumo(usuarioId),
    ]);
    return dispositivos.map((dispositivo) =>
      DispositivoRespostaDto.de(dispositivo, medias.get(dispositivo.id) ?? 0),
    );
  }

  async obter(id: number, usuarioId: number): Promise<DispositivoRespostaDto> {
    const dispositivo = await this.dispositivos.buscarPorId(id, usuarioId);
    if (!dispositivo) throw this.naoEncontrado();
    const medias = await this.mediasDeConsumo(usuarioId);
    return DispositivoRespostaDto.de(dispositivo, medias.get(id) ?? 0);
  }

  async atualizar(
    id: number,
    usuarioId: number,
    dto: SalvarDispositivoDto,
  ): Promise<DispositivoRespostaDto> {
    await this.transacao.executar(async ({ dispositivos, ambientes, historico }) => {
      const atual = await dispositivos.buscarComLock(id, usuarioId);
      if (!atual) throw this.naoEncontrado();

      if (atual.statusAtual && atual.potenciaWatts !== dto.potenciaWatts) {
        const fim = await this.fecharSessaoAberta(atual, historico);
        await historico.abrirSessao(id, fim);
      }

      const ambiente = await ambientes.encontrarOuCriar(usuarioId, dto.comodo);
      await dispositivos.atualizar(id, {
        nome: dto.nome,
        tipo: dto.tipo,
        potenciaWatts: dto.potenciaWatts,
        ambienteId: ambiente.id,
      });
    });
    return this.obter(id, usuarioId);
  }

  async remover(id: number, usuarioId: number): Promise<void> {
    await this.transacao.executar(async ({ dispositivos, historico }) => {
      const atual = await dispositivos.buscarComLock(id, usuarioId);
      if (!atual) throw this.naoEncontrado();
      if (atual.statusAtual) await this.fecharSessaoAberta(atual, historico);
      await dispositivos.remover(id);
    });
  }

  async alterarEstado(
    id: number,
    usuarioId: number,
    ligado: boolean,
  ): Promise<DispositivoRespostaDto> {
    await this.transacao.executar(async ({ dispositivos, historico }) => {
      const atual = await dispositivos.buscarComLock(id, usuarioId);
      if (!atual) throw this.naoEncontrado();
      if (atual.statusAtual === ligado) return;

      if (ligado) {
        await historico.abrirSessao(id, this.relogio.agora());
      } else {
        await this.fecharSessaoAberta(atual, historico);
      }
      await dispositivos.atualizar(id, { statusAtual: ligado });
    });
    return this.obter(id, usuarioId);
  }

  private async fecharSessaoAberta(
    dispositivo: Dispositivo,
    historico: HistoricoRepository,
  ): Promise<Date> {
    const agora = this.relogio.agora();
    const sessao = await historico.buscarSessaoAberta(dispositivo.id);
    if (!sessao) return agora;

    const fim = this.calculadora.instanteDeFechamento(sessao.dataHoraLigado, agora);
    await historico.fecharSessao(
      sessao.id,
      fim,
      this.calculadora.kwhDaSessao(
        dispositivo.potenciaWatts,
        sessao.dataHoraLigado,
        fim,
      ),
    );
    return fim;
  }

  private async mediasDeConsumo(usuarioId: number): Promise<Map<number, number>> {
    const agora = this.relogio.agora();
    const inicio = new Date(agora.getTime() - DIAS_DA_MEDIA * MS_POR_DIA);
    const consumos = await this.consumo.porDispositivoAtivo(usuarioId, inicio, agora);
    return new Map(
      consumos.map(({ dispositivoId, kwh }) => [
        dispositivoId,
        this.calculadora.mediaDiaria(kwh, DIAS_DA_MEDIA),
      ]),
    );
  }

  private naoEncontrado(): NotFoundException {
    return new NotFoundException({ mensagem: 'Dispositivo não encontrado.' });
  }
}
