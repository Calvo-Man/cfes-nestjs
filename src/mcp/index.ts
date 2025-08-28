import { aseosMcpTools } from 'src/aseos/aseos.mcp';
import { AseosService } from 'src/aseos/aseos.service';
import { asistenciasMcpTools } from 'src/asistencias/asistencias.mcp';
import { AsistenciasService } from 'src/asistencias/asistencias.service';
import { CasasDeFeService } from 'src/casas-de-fe/casas-de-fe.service';
import { casasDeFeMcpTools } from 'src/casas-de-fe/casasFe.mcp';
import { eventosMcpTools } from 'src/eventos/eventos.mcp';
import { EventosService } from 'src/eventos/eventos.service';
import { ManejoDeMensajesService } from 'src/manejo-de-mensajes/manejo-de-mensajes.service';
import { mensajesIaMcpTools } from 'src/manejo-de-mensajes/mensajes.mcp';
import { miembrosIaMcpTools } from 'src/miembros/miembros.mcp';
import { MiembrosService } from 'src/miembros/miembros.service';
import { peticionesMcpTools } from 'src/peticiones/peticiones.mcp';
import { PeticionesService } from 'src/peticiones/peticiones.service';
import { teologiaMcpTools } from 'src/whatsapp-bot/chat-gpt/services/teologia.mcp';
import { TeologiaService } from 'src/whatsapp-bot/chat-gpt/services/teologia.service';

export function loadMcpTools(services: {
  peticionesService: PeticionesService;
  teologiaService: TeologiaService;
  aseosService: AseosService;
  asistenciasService: AsistenciasService;
  casasDeFeService: CasasDeFeService;
  eventosService: EventosService;
  mensajesService: ManejoDeMensajesService;
  miembrosService: MiembrosService;
}) {
  return [
    ...peticionesMcpTools(services.peticionesService),
    ...teologiaMcpTools(services.teologiaService),
    ...aseosMcpTools(services.aseosService),
     ...asistenciasMcpTools(services.asistenciasService),
     ...casasDeFeMcpTools(services.casasDeFeService),
     ...eventosMcpTools(services.eventosService),
     ...mensajesIaMcpTools(services.mensajesService),
     ...miembrosIaMcpTools(services.miembrosService),
  ];
}
