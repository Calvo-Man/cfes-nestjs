import { PartialType } from '@nestjs/mapped-types';
import { CreateManejoDeMensajeDto } from './create-manejo-de-mensaje.dto';

export class UpdateManejoDeMensajeDto extends PartialType(CreateManejoDeMensajeDto) {}
