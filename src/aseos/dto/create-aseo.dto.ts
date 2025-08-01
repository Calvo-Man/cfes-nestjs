import { IsInt, IsDateString } from 'class-validator';

export class CreateAseoDto {
  @IsInt()
  miembroId: number;

  @IsDateString()
  fecha: string;
}
