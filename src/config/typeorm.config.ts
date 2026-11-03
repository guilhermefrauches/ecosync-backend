import type { DataSourceOptions } from 'typeorm';
import { migrations } from '../migrations/index.js';
import { Ambiente } from '../modules/ambientes/entities/ambiente.entity.js';
import { Dispositivo } from '../modules/dispositivos/entities/dispositivo.entity.js';
import { HistoricoUso } from '../modules/historico/entities/historico-uso.entity.js';
import { Usuario } from '../modules/usuarios/entities/usuario.entity.js';

interface ConexaoBanco {
  DB_HOST?: string;
  DB_PORTA?: number | string;
  DB_USUARIO?: string;
  DB_SENHA?: string;
  DB_NOME?: string;
}

export function opcoesTypeOrm(env: ConexaoBanco): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: Number(env.DB_PORTA),
    username: env.DB_USUARIO,
    password: env.DB_SENHA,
    database: env.DB_NOME,
    entities: [Usuario, Ambiente, Dispositivo, HistoricoUso],
    migrations,
    synchronize: false,
  };
}
