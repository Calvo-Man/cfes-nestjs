import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MiembrosService } from 'src/miembros/miembros.service';
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class AuthService {
   constructor(
    private jwtService: JwtService,
    private readonly miembroService: MiembrosService,
    private readonly configService: ConfigService
   ) {}
   async login(auth: AuthDto) {
    const user = await this.validateUser(auth);
      const token = this.jwtService.sign(user, {
      secret: this.configService.get<string>('SECRET'), // usa el mismo secret
      expiresIn: '1d',
    });
    return {
      access_token: token,
      user
    };
  }
  async validateUser(auth:AuthDto): Promise<any> {
    const user = await this.miembroService.findOneByUser(auth.user);
    if(!user.activo) throw new UnauthorizedException('Su cuenta ha sido desactivada');
    if(!user) throw new UnauthorizedException('Credenciales inválidas');
    if (user && await bcrypt.compare(auth.password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Credenciales inválidas');
  }

  async changePassword(auth: AuthDto) {
    const miembro = await this.miembroService.findOneByUser(auth.user);
    if (!miembro) {
      throw new UnauthorizedException('Miembro no encontrado');
    }
    const hashedPassword = await bcrypt.hash(auth.password, 10);
    miembro.password = hashedPassword;
    return this.miembroService.update(miembro.id, miembro);
  }
}
