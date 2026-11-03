import {
  Check,
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { numericTransformer } from '../../../common/numeric.transformer.js';
import { Ambiente } from '../../ambientes/entities/ambiente.entity.js';

export const TIPOS_DISPOSITIVO = [
  'luz',
  'climatizacao',
  'eletro',
  'entretenimento',
] as const;

export type TipoDispositivo = (typeof TIPOS_DISPOSITIVO)[number];

@Check('ck_dispositivos_potencia_positiva', '"potencia_watts" > 0')
@Check(
  'ck_dispositivos_tipo',
  `"tipo" IN ('luz', 'climatizacao', 'eletro', 'entretenimento')`,
)
@Entity('dispositivos')
export class Dispositivo {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_dispositivos' })
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  nome!: string;

  @Column({ type: 'varchar', length: 50 })
  tipo!: TipoDispositivo;

  @Column({
    name: 'potencia_watts',
    type: 'decimal',
    precision: 8,
    scale: 2,
    transformer: numericTransformer,
  })
  potenciaWatts!: number;

  @Column({ name: 'status_atual', type: 'boolean', default: false })
  statusAtual!: boolean;

  @Index('ix_dispositivos_ambiente_id')
  @Column({ name: 'ambiente_id', type: 'int' })
  ambienteId!: number;

  @ManyToOne(() => Ambiente, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({
    name: 'ambiente_id',
    foreignKeyConstraintName: 'fk_dispositivos_ambientes',
  })
  ambiente!: Relation<Ambiente>;

  @DeleteDateColumn({ name: 'removido_em', type: 'timestamptz' })
  removidoEm!: Date | null;
}
