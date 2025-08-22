export const ChatMessageParam = [
  {
    type: 'function',
    function: {
      name: 'guardar_peticion_de_oracion',
      description:
        'Guarda la peticion de oracion de las personas en la base de datos',
      parameters: {
        type: 'object',
        properties: {
          contenido: {
            type: 'string',
            description:
              'Texto original de la petición de oración enviada por la persona',
          },
          telefono: {
            type: 'string',
            description:
              'Número de WhatsApp de la persona que solicita la petición.',
          },
          nombre: {
            type: 'string',
            description:
              'Nombre del usuario si lo da. Si no lo menciona, puedes preguntar una sola vez; si aún no lo da, usa "Anónimo".',
          },
          categoria: {
            type: 'string',
            description:
              'Clasificación de la petición, determinada automáticamente por ti. Ej: "Salud", "Familia", "Trabajo y Finanzas", "Espiritual", "Protección", "Estudios", "Agradecimiento", "Otros".',
          },
          redaccion: {
            type: 'string',
            description:
              'Texto redactado de la petición de oración de forma clara y usando decoración profesional como negrita, combinando el contenido,telefono,nombre y categoría, para ser compartido con la comunidad de CEFES por WhatsApp.',
          },
        },
        required: ['telefono', 'contenido', 'categoria', 'redaccion', 'nombre'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_dias_aseo_mes_actual',
      description:
        'Devuelve los días de aseo del miembro que te esta preguntando en el mes actual',
      parameters: {
        type: 'object',
        properties: {
          telefono: { type: 'string', description: 'Número del miembro' },
        },
        required: ['telefono'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_dias_aseo_mes_siguiente',
      description:
        'Devuelve los días de aseo del miembro que te esta preguntando en el mes siguiente',
      parameters: {
        type: 'object',
        properties: {
          telefono: {
            type: 'string',
            description: 'Número del miembro que te esta preguntando',
          },
        },
        required: ['telefono'],
      },
    },
  },
  {
    //Por ahora no funciona
    type: 'function',
    function: {
      name: 'consultar_dias_aseo_mes_anterior',
      description:
        'Devuelve los días de aseo del miembro que te esta preguntando en el mes anterior',
      parameters: {
        type: 'object',
        properties: {
          telefono: {
            type: 'string',
            description: 'Número del miembro que te esta preguntando',
          },
        },
        required: ['telefono'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_encargados_aseos_por_fechas',
      description:
        'Consulta quienes son los encargados de aseo en las fechas solicitadas (Puedes calcular las fechas segun la fecha actual o solicitarlas en el formato YYYY-MM-DD)',
      parameters: {
        type: 'object',
        properties: {
          telefono: {
            type: 'string',
            description: 'Número del miembro que te esta preguntando',
          },
          fechas: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Lista de fechas en el formato YYYY-MM-DD, separadas por comas',
          },
        },
        required: ['telefono', 'fechas'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_datos_miembro',
      description:
        'Consulta la informacion del miembro que te esta escribiendo (Como el dia seleccionado para disponibilidad de aseo) - si la pregunta es sobre horario de aseo o dia de aseo usa otra funcion',
      parameters: {
        type: 'object',
        properties: {
          telefono: {
            type: 'string',
            description: 'Número del miembro que te esta escribiendo',
          },
        },
        required: ['telefono'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_casas_fe',
      description: 'Devuelve casas de fe disponibles',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_actividades_por_mes',
      description:
        'Devuelve actividades o eventos disponibles para el mes solicitado',
      parameters: {
        type: 'object',
        properties: {
          mes: {
            type: 'string',
            description:
              'Mes en el que se desea consultar las actividades en formato: aa-mm, ejemplo: 2023-05 (Calcula el mes segun la fecha actual o solicita el mes en el que se desea consultar)',
          },
        },
        required: ['mes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cambiar_modo_respuesta',
      description:
        'Cambia el modo de respuesta preferido por el usuario, puede ser "texto" o "voz"',
      parameters: {
        type: 'object',
        properties: {
          modo: {
            type: 'string',
            description: 'Modo de respuesta preferido por el usuario',
          },
          telefono: {
            type: 'string',
            description: 'Número del miembro que te esta preguntando',
          },
        },
        required: ['modo', 'telefono'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cambiar_dia_de_aseo_preferido',
      description:
        'Cambia el dia preferido para hacer el aseo por el usuario, Solo es posible elegir entre "domingo" o "jueves" o "cualquiera"(cualquiera significa que puede ser cualquiera de los dos)',
      parameters: {
        type: 'object',
        properties: {
          telefono: {
            type: 'string',
            description: 'Número del miembro que te esta preguntando',
          },
          horario: {
            type: 'string',
            description: 'Dia de aseo preferido por el usuario',
          },
        },
        required: ['telefono', 'horario'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscarRespuestaTeologica',
      description:
        'Busca una o varias respuestas teológicas en la base de datos usando la(s) pregunta(s) como consulta semántica. Antes de buscar, reformula cada pregunta para que sea clara, específica, y contenga términos teológicos y bíblicos relevantes, eliminando ambigüedades o detalles irrelevantes, con el fin de obtener la mejor coincidencia posible.',
      parameters: {
        type: 'object',
        properties: {
          preguntas: {
            type: 'array',
            description:
              'Lista de preguntas para la búsqueda semántica en Qdrant. Cada pregunta debe estar escrita en lenguaje claro y preciso, incluir términos teológicos o bíblicos relevantes, y evitar pronombres ambiguos o frases vagas.',
            items: {
              type: 'string',
            },
          },
        },
        required: ['preguntas'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sobre_tu_creacion',
      description: 'Describe tu creacion.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sobre_tus_capacidades',
      description: 'Describe tus capacidades.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];
