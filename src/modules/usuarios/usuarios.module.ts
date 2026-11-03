import { Module } from '@nestjs/common';
import { CookieSessao } from '../../common/sessao/cookie-sessao.js';
import { HasherSenha, HasherSenhaArgon2 } from './hasher-senha.js';
import { UsuarioTypeormRepository } from './repositories/usuario-typeorm.repository.js';
import { UsuarioRepository } from './repositories/usuario.repository.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  controllers: [UsuariosController],
  providers: [
    UsuariosService,
    CookieSessao,
    { provide: UsuarioRepository, useClass: UsuarioTypeormRepository },
    { provide: HasherSenha, useClass: HasherSenhaArgon2 },
  ],
  exports: [UsuarioRepository, HasherSenha],
})
export class UsuariosModule {}
