/** MT-DO-002 versión 8, tomado de Caracterización 2026. */

export type RequisitoNormativo = {
  id: string;
  numeral: string;
  titulo: string;
  enEsteProceso: string;
};

export const CARACTERIZACION = {
  titulo: "Caracterización de procesos de mantenimiento",
  codigo: "MT-DO-002",
  version: "8",
  elaboracion: "1 de septiembre de 2010",
  modificacion: "18 de septiembre de 2026",
  proceso: "Mantenimiento",
  objetivo:
    "Garantizar el correcto funcionamiento, disponibilidad y seguridad de los equipos, herramientas, infraestructura y activos de la empresa, mediante la ejecución de mantenimientos preventivos, correctivos y mejoras, asegurando continuidad operativa y minimizando riesgos.",
  alcance:
    "Inicia con la identificación de una necesidad de mantenimiento (programada o por falla) y finaliza con la ejecución, verificación del servicio realizado, registro y cierre de la solicitud.",
  interaccion:
    "El área de Mantenimiento interactúa con los diferentes procesos mediante la recepción de solicitudes, reportes y requerimientos relacionados con equipos, maquinaria e instalaciones, con el fin de planificar y ejecutar actividades de mantenimiento preventivo y correctivo, garantizando la disponibilidad, confiabilidad y adecuado funcionamiento de los recursos necesarios para la operación.",
  responsable:
    "El coordinador de Mantenimiento es responsable de planificar, coordinar y supervisar la ejecución de las actividades de mantenimiento preventivo, correctivo y locativo, asegurando la disponibilidad y el funcionamiento, y de gestionar la atención a los requerimientos de los clientes externos.",
  recursos:
    "Humano técnico (interno o externo), herramientas de trabajo, equipos de medición, elementos de protección personal (EPP), formatos de mantenimiento, inventario de activos, registro de historial por equipo, repuestos, aire, energía, internet y plataforma de mantenimiento.",
  documentos:
    "Se encuentran identificados y controlados mediante el listado maestro de documentos internos SGC-RE-002.",
  riesgos: [
    "Falla crítica de equipos por ausencia o deficiencia del mantenimiento preventivo.",
    "Accidentes laborales asociados a fallas o condiciones inseguras de equipos.",
  ],
  oportunidades: [
    "Digitalización de todo el proceso de mantenimiento.",
    "Renovación de equipos críticos.",
  ],
  indicadores: [
    {
      nombre: "Cumplimiento a mantenimientos preventivos",
      meta: "1",
      frecuencia: "Mensual",
      metodo: "Mantenimientos preventivos realizados / mantenimientos preventivos programados",
    },
    {
      nombre: "Tiempo de respuesta a las solicitudes de mantenimiento correctivo",
      meta: "10 minutos",
      frecuencia: "Mensual",
      metodo: "Promedio del tiempo de respuesta en minutos",
    },
    {
      nombre: "Porcentaje de horas perdidas por mantenimiento correctivo",
      meta: "0.01",
      frecuencia: "Mensual",
      metodo: "Tiempo real de mantenimiento / horas programadas",
    },
  ],
};

export const FLUJO: { columna: string; puntos: string[] }[] = [
  {
    columna: "Proveedores",
    puntos: [
      "Todos los procesos",
      "Laboratorio",
      "Calidad",
      "Compras",
      "Gestión Humana",
      "SGC",
      "Gerencia",
    ],
  },
  {
    columna: "Entradas",
    puntos: [
      "Planeación de mantenimiento preventivo.",
      "Solicitud de mantenimiento correctivo.",
      "Solicitud de mantenimiento correctivo del laboratorio.",
      "Requerimiento de clientes por garantías.",
      "Solicitud de cambio de repuesto por el cliente.",
      "Solicitud de mantenimiento preventivo por parte del cliente.",
      "Repuestos e insumos.",
      "Solicitud de mantenimiento locativo.",
      "Requerimiento del SGC.",
      "Manuales técnicos y fichas de los equipos.",
      "Solicitud de requerimientos de necesidad del proceso.",
    ],
  },
  {
    columna: "Actividades",
    puntos: [
      "Cronogramas de mantenimientos.",
      "Ejecución del plan de mantenimiento.",
      "Registro de mantenimientos realizados.",
      "Historial de mantenimientos.",
      "Parada de máquinas para la revisión de preventivo y correctivo, de acuerdo con la solicitud del proceso.",
      "Identificación de la necesidad (preventivo o correctivo).",
      "Registro de solicitud / reporte del cliente.",
      "Pruebas de funcionamiento y verificación.",
      "Gestión de repuestos y herramientas nacionales o importadas.",
      "Verificación del estado de la infraestructura locativa.",
      "Recibir auditorías internas y externas.",
      "Actualización de documentos.",
      "Tomar acciones correctivas, preventivas y de mejora.",
      "Elaboración de presupuesto.",
    ],
  },
  {
    columna: "Salidas",
    puntos: [
      "Mantenimiento ejecutado (preventivo / correctivo).",
      "Registros de mantenimientos actualizados.",
      "Cierre de solicitud y seguimiento.",
      "Informe de novedades o hallazgos.",
      "Recomendaciones técnicas.",
      "Programación de mantenimiento futuro.",
      "Elaborar y analizar reportes e informes.",
      "Entrega de repuestos y herramientas al equipo de trabajo.",
      "Infraestructura en funcionamiento.",
      "Lista de hallazgos.",
      "Planes de acción.",
      "Indicadores.",
      "Acciones correctivas y de mejora.",
      "Presupuesto final.",
    ],
  },
  {
    columna: "Clientes",
    puntos: [
      "Todos los procesos",
      "Calidad",
      "Cliente externo",
      "Mantenimiento",
      "Gestión Humana",
      "SGC",
      "Gerencias",
    ],
  },
];

export const REQUISITOS: RequisitoNormativo[] = [
  {
    id: "4.4",
    numeral: "4.4",
    titulo: "Sistema de gestión de la calidad y sus procesos",
    enEsteProceso:
      "El proceso queda definido con objetivo, alcance, proveedores, entradas, actividades, salidas, clientes y la interacción con los demás procesos.",
  },
  {
    id: "6.1",
    numeral: "6.1",
    titulo: "Acciones para abordar riesgos y oportunidades",
    enEsteProceso:
      "Riesgos: falla crítica de equipos por ausencia o deficiencia del preventivo, y accidentes por fallas o condiciones inseguras. Oportunidades: digitalizar el proceso y renovar equipos críticos.",
  },
  {
    id: "7.1.3",
    numeral: "7.1.3",
    titulo: "Infraestructura",
    enEsteProceso:
      "Cubre equipos, herramientas, infraestructura y activos. Incluye la verificación locativa y la salida de infraestructura en funcionamiento.",
  },
  {
    id: "7.1.4",
    numeral: "7.1.4",
    titulo: "Ambiente para la operación de los procesos",
    enEsteProceso:
      "El objetivo pide disponibilidad y seguridad de los equipos. El riesgo asociado es el accidente por condiciones inseguras.",
  },
  {
    id: "7.1.5",
    numeral: "7.1.5",
    titulo: "Recursos de seguimiento y medición",
    enEsteProceso:
      "Los recursos incluyen equipos de medición. La actividad correspondiente es pruebas de funcionamiento y verificación.",
  },
  {
    id: "7.2",
    numeral: "7.2",
    titulo: "Competencia",
    enEsteProceso: "El recurso humano es el técnico interno o externo que ejecuta el mantenimiento.",
  },
  {
    id: "7.5",
    numeral: "7.5",
    titulo: "Información documentada",
    enEsteProceso:
      "Documentos y registros controlados con el listado maestro SGC-RE-002. También manuales técnicos, fichas, historial por equipo y registros de lo realizado.",
  },
  {
    id: "8.1",
    numeral: "8.1",
    titulo: "Planificación y control operacional",
    enEsteProceso:
      "Va de la necesidad (programada o por falla) a la ejecución, la verificación, el registro y el cierre. Incluye cronograma, parada de máquina y presupuesto.",
  },
  {
    id: "8.4",
    numeral: "8.4",
    titulo: "Control de los procesos, productos y servicios suministrados externamente",
    enEsteProceso:
      "Proveedores de Compras y técnico externo. Cubre repuestos e insumos nacionales o importados y su entrega al equipo de trabajo.",
  },
  {
    id: "9.1",
    numeral: "9.1",
    titulo: "Seguimiento, medición, análisis y evaluación",
    enEsteProceso:
      "Tres indicadores mensuales: cumplimiento de preventivos, tiempo de respuesta del correctivo y porcentaje de horas perdidas. También auditorías internas y externas.",
  },
  {
    id: "10.2",
    numeral: "10.2",
    titulo: "No conformidad y acción correctiva",
    enEsteProceso:
      "Hallazgos, planes de acción y acciones correctivas, preventivas y de mejora, incluidas las que salen de las auditorías.",
  },
];
