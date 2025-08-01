/* eslint-disable prettier/prettier */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener los roles requeridos desde el decorador
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    try {
      // Obtener la solicitud y el token del header
      const request = context.switchToHttp().getRequest();

      const token = request.headers.authorization?.split(' ')[1];
      // Verificar si el token no existe
      if (!token) {
        throw new UnauthorizedException('No credentials provided');
      }
      // Si no se especificaron roles, permite el acceso
      if (!requiredRoles) {
        return true;
      }
      // Verificar el token de manera asíncrona para obtener el usuario
      const user = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('SECRET'),
      });

      // Verificar si el usuario tiene alguno de los roles requeridos
      const userRole = user.rol;
      const hasRole = requiredRoles.some((roles) => userRole === roles);

      if (!hasRole) {
        throw new ForbiddenException('You do not have access to this resource');
      }
      return true;
    } catch (error) {
      // Manejo de errores como token expirado o inválido
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token', error.message);
      }

      throw error;
    }
  }
}
