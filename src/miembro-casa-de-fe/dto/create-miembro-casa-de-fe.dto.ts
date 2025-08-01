import { IsNotEmpty, IsOptional, IsString } from "class-validator"
import { CasasDeFe } from "src/casas-de-fe/entities/casas-de-fe.entity"

export class CreateMiembroCasaDeFeDto {
    @IsString()
    @IsNotEmpty()
    nombre: string
    @IsString()
    @IsNotEmpty()
    apellido: string
    @IsString()
    @IsNotEmpty()
    telefono: string
    @IsString()
    @IsOptional()
    direccion: string
    @IsNotEmpty()
    casasDeFeId: number


}
