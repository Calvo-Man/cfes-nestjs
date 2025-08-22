import { PartialType } from '@nestjs/mapped-types';
import { CreatePeticionDto } from './create-peticione.dto';

export class UpdatePeticionDto extends PartialType(CreatePeticionDto) {}
