import { Email, SenhaInformada } from '../../usuarios/dto/usuario.dto.js';

export class LoginDto {
  @Email()
  email!: string;

  @SenhaInformada()
  senha!: string;
}
