import { Expose } from "class-transformer";

export class MiembroCasaDeFeDto {
    @Expose()
    id: number;
    @Expose()
    nombre: string;
    @Expose()
    apellido: string;
    @Expose()
    telefono: string;
    @Expose()
    direccion: string;
    
}