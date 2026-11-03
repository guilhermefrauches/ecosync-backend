import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

@Index('ux_ambientes_usuario_nome_ativo', { synchronize: false })
@Entity('ambientes')
export class Ambiente {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_ambientes' })
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  nome!: string;

  @Index('ix_ambientes_usuario_id')
  @Column({ name: 'usuario_id', type: 'int' })
  usuarioId!: number;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({
    name: 'usuario_id',
    foreignKeyConstraintName: 'fk_ambientes_usuarios',
  })
  usuario?: Relation<Usuario>;

  @DeleteDateColumn({ name: 'removido_em', type: 'timestamptz' })
  removidoEm!: Date | null;
}
