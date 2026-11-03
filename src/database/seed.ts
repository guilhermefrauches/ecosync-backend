import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { type Dia, diaDe, inicioDoDia, somarDias } from '../common/fuso-horario.js';
import { opcoesTypeOrm } from '../config/typeorm.config.js';
import { Ambiente } from '../modules/ambientes/entities/ambiente.entity.js';
import {
  Dispositivo,
  type TipoDispositivo,
} from '../modules/dispositivos/entities/dispositivo.entity.js';
import { CalculadoraConsumo } from '../modules/historico/calculadora-consumo.js';
import { HistoricoUso } from '../modules/historico/entities/historico-uso.entity.js';
import { Usuario } from '../modules/usuarios/entities/usuario.entity.js';
import { HasherSenhaArgon2 } from '../modules/usuarios/hasher-senha.js';

const EMAIL = 'fabio@ecosync.com';
const DIAS_DE_HISTORICO = 16 * 7;
const MS_POR_HORA = 3_600_000;

interface Modelo {
  nome: string;
  comodo: string;
  tipo: TipoDispositivo;
  potenciaWatts: number;
  ligado: boolean;
  inicio: number;
  horas: number;
  variacao: number;
  diasDaSemana?: number[];
}

const MODELOS: Modelo[] = [
  { nome: 'Ar-condicionado', comodo: 'Sala', tipo: 'climatizacao', potenciaWatts: 1200, ligado: false, inicio: 19, horas: 3, variacao: 0.5 },
  { nome: 'Ar-condicionado', comodo: 'Quarto', tipo: 'climatizacao', potenciaWatts: 900, ligado: false, inicio: 22, horas: 6, variacao: 0.5 },
  { nome: 'Lâmpada principal', comodo: 'Sala', tipo: 'luz', potenciaWatts: 15, ligado: true, inicio: 18, horas: 5, variacao: 0.5 },
  { nome: 'Lâmpada da mesa', comodo: 'Quarto', tipo: 'luz', potenciaWatts: 10, ligado: false, inicio: 20, horas: 2, variacao: 0.5 },
  { nome: 'Lâmpada do corredor', comodo: 'Corredor', tipo: 'luz', potenciaWatts: 8, ligado: true, inicio: 18.5, horas: 5, variacao: 0.25 },
  { nome: 'Geladeira', comodo: 'Cozinha', tipo: 'eletro', potenciaWatts: 70, ligado: true, inicio: 0, horas: 24, variacao: 0 },
  { nome: 'Micro-ondas', comodo: 'Cozinha', tipo: 'eletro', potenciaWatts: 1200, ligado: false, inicio: 12, horas: 0.2, variacao: 0.05 },
  { nome: 'Máquina de lavar', comodo: 'Lavanderia', tipo: 'eletro', potenciaWatts: 500, ligado: false, inicio: 9, horas: 1.5, variacao: 0.25, diasDaSemana: [3, 6] },
  { nome: 'Smart TV', comodo: 'Sala', tipo: 'entretenimento', potenciaWatts: 100, ligado: false, inicio: 20, horas: 3, variacao: 0.75 },
];

function criarSorteio(semente: number): (variacao: number) => number {
  let estado = semente;
  return (variacao) => {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return (estado / 4294967296 - 0.5) * 2 * variacao;
  };
}

function sessoesDe(
  modelo: Modelo,
  dispositivoId: number,
  agora: Date,
  semente: number,
): Partial<HistoricoUso>[] {
  const calculadora = new CalculadoraConsumo();
  const sortear = criarSorteio(semente);
  const hoje: Dia = diaDe(agora);
  const periodos: { ligado: Date; desligado: Date }[] = [];

  for (let n = DIAS_DE_HISTORICO; n >= 0; n--) {
    const dia = somarDias(hoje, -n);
    const inicioDia = inicioDoDia(dia).getTime();
    const usado =
      !modelo.diasDaSemana ||
      modelo.diasDaSemana.includes(new Date(`${dia}T00:00:00Z`).getUTCDay());
    const ajusteInicio = sortear(modelo.variacao);
    const ajusteHoras = sortear(modelo.variacao);
    if (!usado) continue;

    const ligado = new Date(
      inicioDia + (modelo.inicio + ajusteInicio) * MS_POR_HORA,
    );
    const desligado = new Date(
      ligado.getTime() + (modelo.horas + ajusteHoras) * MS_POR_HORA,
    );
    if (ligado < agora) periodos.push({ ligado, desligado });
  }

  const fechados = periodos.filter((p) => p.desligado <= agora);
  const emCurso = periodos.find((p) => p.desligado > agora);
  const sessoes: Partial<HistoricoUso>[] = (
    modelo.ligado && !emCurso ? fechados.slice(0, -1) : fechados
  ).map(({ ligado, desligado }) => ({
    dispositivoId,
    dataHoraLigado: ligado,
    dataHoraDesligado: desligado,
    consumoKwh: calculadora.kwhDaSessao(modelo.potenciaWatts, ligado, desligado),
  }));

  if (modelo.ligado) {
    const aberta = emCurso ?? fechados[fechados.length - 1];
    sessoes.push({
      dispositivoId,
      dataHoraLigado: aberta.ligado,
      dataHoraDesligado: null,
      consumoKwh: null,
    });
  }
  return sessoes;
}

async function semear(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed é apenas para desenvolvimento.');
  }
  const senha = process.env.SEED_SENHA;
  if (!senha || senha.length < 6) {
    throw new Error('Defina SEED_SENHA no .env, com pelo menos 6 caracteres.');
  }

  const banco = await new DataSource(opcoesTypeOrm(process.env)).initialize();
  try {
    if (await banco.manager.existsBy(Usuario, { email: EMAIL })) {
      console.log(`O usuário ${EMAIL} já existe: nada foi alterado.`);
      return;
    }

    const hash = await new HasherSenhaArgon2().gerarHash(senha);
    const agora = new Date();
    let totalSessoes = 0;

    await banco.transaction(async (tx) => {
      const usuario = await tx.save(
        tx.create(Usuario, { nome: 'Fábio Santos', email: EMAIL, senha: hash }),
      );

      const ambientes = new Map<string, Ambiente>();
      for (const nome of new Set(MODELOS.map((m) => m.comodo))) {
        ambientes.set(
          nome,
          await tx.save(tx.create(Ambiente, { nome, usuarioId: usuario.id })),
        );
      }

      for (const [indice, modelo] of MODELOS.entries()) {
        const dispositivo = await tx.save(
          tx.create(Dispositivo, {
            nome: modelo.nome,
            tipo: modelo.tipo,
            potenciaWatts: modelo.potenciaWatts,
            statusAtual: modelo.ligado,
            ambienteId: ambientes.get(modelo.comodo)!.id,
          }),
        );
        const sessoes = sessoesDe(modelo, dispositivo.id, agora, indice + 1);
        await tx.insert(HistoricoUso, sessoes);
        totalSessoes += sessoes.length;
      }
    });

    console.log(
      `Seed concluído: ${EMAIL}, ${MODELOS.length} dispositivos e ${totalSessoes} sessões de uso.`,
    );
  } finally {
    await banco.destroy();
  }
}

await semear();
