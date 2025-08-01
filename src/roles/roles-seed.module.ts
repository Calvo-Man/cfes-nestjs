/* eslint-disable prettier/prettier */
import { Module, OnModuleInit } from '@nestjs/common';
import { RoleSeedService } from './roles-seed.service';
import { Role } from './entities/role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [RoleSeedService],
  exports: [RoleSeedService],
})
export class RoleSeedModule implements OnModuleInit {
  constructor(private readonly roleSeedService: RoleSeedService) {}

  async onModuleInit() {
    await this.roleSeedService.createRoles();  // Crear roles en la base de datos
  }
}