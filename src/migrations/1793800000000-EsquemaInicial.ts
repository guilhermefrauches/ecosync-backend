import type { MigrationInterface, QueryRunner } from 'typeorm';

export class EsquemaInicial1793800000000 implements MigrationInterface {
  name = 'EsquemaInicial1793800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE usuarios (
        id SERIAL NOT NULL,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        senha VARCHAR(250) NOT NULL,
        removido_em TIMESTAMPTZ,
        CONSTRAINT pk_usuarios PRIMARY KEY (id)
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX ux_usuarios_email_lower ON usuarios (lower(email))`,
    );

    await queryRunner.query(`
      CREATE TABLE ambientes (
        id SERIAL NOT NULL,
        nome VARCHAR(50) NOT NULL,
        usuario_id INT NOT NULL,
        removido_em TIMESTAMPTZ,
        CONSTRAINT pk_ambientes PRIMARY KEY (id),
        CONSTRAINT fk_ambientes_usuarios
          FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX ix_ambientes_usuario_id ON ambientes (usuario_id)`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX ux_ambientes_usuario_nome_ativo
        ON ambientes (usuario_id, lower(nome))
        WHERE removido_em IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE dispositivos (
        id SERIAL NOT NULL,
        nome VARCHAR(50) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        potencia_watts DECIMAL(8, 2) NOT NULL,
        status_atual BOOLEAN NOT NULL DEFAULT FALSE,
        ambiente_id INT NOT NULL,
        removido_em TIMESTAMPTZ,
        CONSTRAINT pk_dispositivos PRIMARY KEY (id),
        CONSTRAINT ck_dispositivos_potencia_positiva CHECK (potencia_watts > 0),
        CONSTRAINT ck_dispositivos_tipo
          CHECK (tipo IN ('luz', 'climatizacao', 'eletro', 'entretenimento')),
        CONSTRAINT fk_dispositivos_ambientes
          FOREIGN KEY (ambiente_id) REFERENCES ambientes (id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX ix_dispositivos_ambiente_id ON dispositivos (ambiente_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE historico_uso (
        id SERIAL NOT NULL,
        dispositivo_id INT NOT NULL,
        data_hora_ligado TIMESTAMPTZ NOT NULL,
        data_hora_desligado TIMESTAMPTZ,
        consumo_kwh DECIMAL(10, 4),
        CONSTRAINT pk_historico_uso PRIMARY KEY (id),
        CONSTRAINT ck_historico_uso_periodo
          CHECK (data_hora_desligado > data_hora_ligado),
        CONSTRAINT fk_historico_dispositivos
          FOREIGN KEY (dispositivo_id) REFERENCES dispositivos (id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX ix_historico_uso_dispositivo_id ON historico_uso (dispositivo_id)`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX ux_historico_uso_sessao_aberta
        ON historico_uso (dispositivo_id)
        WHERE data_hora_desligado IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE historico_uso`);
    await queryRunner.query(`DROP TABLE dispositivos`);
    await queryRunner.query(`DROP TABLE ambientes`);
    await queryRunner.query(`DROP TABLE usuarios`);
  }
}
