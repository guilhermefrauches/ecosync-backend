import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Index('ux_usuarios_email_lower', { synchronize: false })
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_usuarios' })
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  nome!: string;

  @Column({ type: 'varchar', length: 100 })
  email!: string;

  @Column({ type: 'varchar', length: 250 })
  senha!: string;

  @DeleteDateColumn({ name: 'removido_em', type: 'timestamptz' })
  removidoEm!: Date | null;
}
