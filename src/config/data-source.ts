import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { opcoesTypeOrm } from './typeorm.config.js';

export default new DataSource(opcoesTypeOrm(process.env));
