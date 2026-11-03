import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { numericTransformer } from '../../../common/numeric.transformer.js';
import { Dispositivo } from '../../dispositivos/entities/dispositivo.entity.js';

@Index('ux_historico_uso_sessao_aberta', { synchronize: false })
@Check(
  'ck_historico_uso_periodo',
  '"data_hora_desligado" > "data_hora_ligado"',
)
@Entity('historico_uso')
export class HistoricoUso {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_historico_uso' })
  id!: number;

  @Index('ix_historico_uso_dispositivo_id')
  @Column({ name: 'dispositivo_id', type: 'int' })
  dispositivoId!: number;

  @ManyToOne(() => Dispositivo, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({
    name: 'dispositivo_id',
    foreignKeyConstraintName: 'fk_historico_dispositivos',
  })
  dispositivo?: Relation<Dispositivo>;

  @Column({ name: 'data_hora_ligado', type: 'timestamptz' })
  dataHoraLigado!: Date;

  @Column({ name: 'data_hora_desligado', type: 'timestamptz', nullable: true })
  dataHoraDesligado!: Date | null;

  @Column({
    name: 'consumo_kwh',
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
    transformer: numericTransformer,
  })
  consumoKwh!: number | null;
}
