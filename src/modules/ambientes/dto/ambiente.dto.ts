import { Texto } from '../../../common/validacao/texto.decorator.js';
import type { Ambiente } from '../entities/ambiente.entity.js';

export class SalvarAmbienteDto {
  @Texto('O nome', 50)
  nome!: string;
}

export class AmbienteRespostaDto {
  id!: number;
  nome!: string;

  static de(ambiente: Ambiente): AmbienteRespostaDto {
    return { id: ambiente.id, nome: ambiente.nome };
  }
}
