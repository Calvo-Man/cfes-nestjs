import { PartialType } from '@nestjs/mapped-types';
import { CreateMiembroCasaDeFeDto } from './create-miembro-casa-de-fe.dto';

export class UpdateMiembroCasaDeFeDto extends PartialType(CreateMiembroCasaDeFeDto) {}
