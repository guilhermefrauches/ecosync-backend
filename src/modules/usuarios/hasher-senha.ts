import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';

export abstract class HasherSenha {
  abstract gerarHash(senha: string): Promise<string>;
  abstract confere(hash: string, senha: string): Promise<boolean>;
}

@Injectable()
export class HasherSenhaArgon2 extends HasherSenha {
  gerarHash(senha: string): Promise<string> {
    return argon2.hash(senha);
  }

  confere(hash: string, senha: string): Promise<boolean> {
    return argon2.verify(hash, senha);
  }
}
