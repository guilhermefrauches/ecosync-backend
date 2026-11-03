import { Injectable } from '@nestjs/common';

export abstract class Relogio {
  abstract agora(): Date;
}

@Injectable()
export class RelogioSistema extends Relogio {
  agora(): Date {
    return new Date();
  }
}
