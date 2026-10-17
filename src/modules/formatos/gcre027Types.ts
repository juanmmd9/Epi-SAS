export interface FilaPlanCambio {
  actividad: string;
  responsable: string;
  comunicar: string;
  fechaEjecucion: string;
  fechaSeguimiento: string;
}

export interface RegistroGc027Datos {
  fechaDiligenciamiento: string;
  fechaUltimaRevision: string;
  proceso: string;
  responsable: string;
  descripcion: string;
  riesgos: string;
  oportunidades: string;
  requisitosLegales: string;
  impacto: string;
  plan: FilaPlanCambio[];
}

export interface RegistroGc027 {
  id: string;
  numero: number;
  area: string | null;
  datos: RegistroGc027Datos;
  creado_en: string;
}

export function filaPlanCambioVacia(): FilaPlanCambio {
  return {
    actividad: "",
    responsable: "",
    comunicar: "",
    fechaEjecucion: "",
    fechaSeguimiento: "",
  };
}

export function formularioGc027Vacio(): RegistroGc027Datos {
  return {
    fechaDiligenciamiento: new Date().toISOString().slice(0, 10),
    fechaUltimaRevision: "",
    proceso: "",
    responsable: "",
    descripcion: "",
    riesgos: "",
    oportunidades: "",
    requisitosLegales: "",
    impacto: "",
    plan: [filaPlanCambioVacia()],
  };
}

/** Máximo de filas del plan en la plantilla Excel oficial. */
export const MAX_ACTIVIDADES_PLAN = 6;

export function normalizarDatosGc027(
  parcial: Partial<RegistroGc027Datos>,
): RegistroGc027Datos {
  const base = formularioGc027Vacio();
  const planOrigen = parcial.plan?.length ? parcial.plan : base.plan;
  return {
    ...base,
    ...parcial,
    plan: planOrigen.map((f) => ({ ...filaPlanCambioVacia(), ...f })),
  };
}

/** Inspección de trípodes y retráctiles, con formulario de enlace para el cliente. */
export function prefillInspeccionTripodesRetractiles(): RegistroGc027Datos {
  return normalizarDatosGc027({
    fechaDiligenciamiento: "2026-10-13",
    fechaUltimaRevision: "2026-10-13",
    proceso: "Mantenimiento",
    responsable: "Coordinación de Mantenimiento",
    descripcion:
      "INSPECCIÓN, MANTENIMIENTO DE TRÍPODES Y RETRÁCTILES\n\n" +
      "Se establece el seguimiento de trípodes y equipos retráctiles utilizados en trabajos en alturas y espacios confinados.\n\n" +
      "Este formulario tiene como finalidad recopilar la información necesaria para la inspección, el mantenimiento y la reparación de esos equipos. Por este medio se hace el seguimiento del estado, la identificación de novedades y el registro de las actividades realizadas, para garantizar su correcto funcionamiento, la seguridad y el cumplimiento de las condiciones requeridas para su operación.\n\n" +
      "Como parte del cambio se creó un formulario con enlace, para que lo diligencien los clientes que tienen el producto y necesitan la inspección del retráctil.",
    riesgos:
      "1) El cliente no diligencia el formulario y el retráctil o el trípode se usa sin inspección.\n" +
      "2) La información llega incompleta y no permite identificar la novedad del equipo.\n" +
      "3) Pasa tiempo entre la solicitud del cliente y la inspección, el mantenimiento o la reparación.\n" +
      "4) Un equipo con novedad sigue en operación antes de ser revisado.\n" +
      "5) El enlace se comparte sin identificar qué cliente diligenció la solicitud.",
    oportunidades:
      "1) Canal único para que el cliente que ya tiene el producto pida la inspección del retráctil.\n" +
      "2) Seguimiento del estado de trípodes y retráctiles, con identificación de novedades.\n" +
      "3) Registro de la inspección, el mantenimiento y la reparación realizados.\n" +
      "4) El equipo vuelve a operación solo cuando cumple las condiciones de seguridad.",
    requisitosLegales:
      "Aplica la normativa de trabajo en alturas y de espacios confinados para equipos de protección contra caídas: inspección, mantenimiento y retiro de servicio de trípodes y retráctiles cuando no cumplan las condiciones de uso. Referencia: Resolución 4272 de 2021 del Ministerio del Trabajo y la norma aplicable a espacios confinados.\n" +
      "El formulario con enlace inicia el seguimiento. No reemplaza la inspección física del equipo.",
    impacto:
      "Proceso: se recibe por enlace la solicitud de inspección del retráctil de los clientes que tienen el producto, y se registra la inspección, el mantenimiento o la reparación de trípodes y retráctiles.\n" +
      "Personas: el cliente diligencia el formulario; Mantenimiento revisa la información, inspecciona el equipo y registra la actividad.\n" +
      "Tecnología: formulario con enlace para el cliente.\n" +
      "Seguridad: el equipo se usa cuando está en condiciones de operación.\n" +
      "Documentación: este GC-RE-027 deja registrado el cambio.",
    plan: [
      {
        actividad:
          "Crear el formulario con enlace para que el cliente que tiene el producto solicite la inspección del retráctil.",
        responsable: "Coordinación de Mantenimiento",
        comunicar: "Clientes que tienen el producto y área comercial",
        fechaEjecucion: "2026-10-13",
        fechaSeguimiento: "2026-10-31",
      },
      {
        actividad:
          "Entregar el enlace a los clientes que tienen trípode o retráctil y necesitan inspección.",
        responsable: "Comercial / Mantenimiento",
        comunicar: "Clientes que tienen el producto",
        fechaEjecucion: "2026-10-20",
        fechaSeguimiento: "2026-10-31",
      },
      {
        actividad: "Revisar cada formulario recibido: estado del equipo y novedades reportadas.",
        responsable: "Mantenimiento",
        comunicar: "Cliente y Coordinación de Mantenimiento",
        fechaEjecucion: "2026-10-31",
        fechaSeguimiento: "2026-11-15",
      },
      {
        actividad:
          "Ejecutar la inspección, el mantenimiento o la reparación del trípode o del retráctil según la novedad.",
        responsable: "Mantenimiento",
        comunicar: "Cliente",
        fechaEjecucion: "2026-11-15",
        fechaSeguimiento: "2026-11-30",
      },
      {
        actividad: "Registrar la actividad realizada y el estado final del equipo.",
        responsable: "Mantenimiento",
        comunicar: "Cliente y SGC",
        fechaEjecucion: "2026-11-30",
        fechaSeguimiento: "2026-12-15",
      },
      {
        actividad:
          "Verificar que el equipo queda apto para operación o queda fuera de servicio si no cumple.",
        responsable: "Coordinación de Mantenimiento",
        comunicar: "Cliente",
        fechaEjecucion: "2026-12-15",
        fechaSeguimiento: "2026-12-31",
      },
    ],
  });
}

/** Prefill con el cambio del Portal de Mantenimiento EPI. */
export function prefillPortalMantenimiento(): RegistroGc027Datos {
  return normalizarDatosGc027({
    fechaDiligenciamiento: "2026-07-09",
    fechaUltimaRevision: "2026-07-09",
    proceso: "Mantenimiento",
    responsable: "Juan Manuel Moncayo",
    descripcion:
      "Se implementa el «Portal de Mantenimiento EPI», aplicación web que reemplaza el manejo disperso de información (Excel, Word y carpetas locales) por un sistema centralizado en la nube (Supabase).\n\n" +
      "El cambio incluye: panel de mantenimiento preventivo por área (solo consulta para solicitantes); registro de preventivo y correctivo; módulo de Solicitudes por área (tablero con abiertas, espera de repuesto, cerradas del mes y repuestos pendientes); hojas de vida de máquinas con fotos; indicadores; formatos SGC (GC-RE-001, GC-RE-009, MT-RE-045, GH-RE-030); personal, matriz de conocimientos, permisos; y control de acceso por roles (administrador, operador, consulta y solicitante de área).\n\n" +
      "Alcance: todas las áreas de planta. Estado a la fecha: piloto funcional en producción (GitHub Pages) con usuarios de prueba y flujo de solicitudes operativo.",
    riesgos:
      "1) Resistencia al cambio o baja adopción por parte del personal de planta y mantenimiento.\n" +
      "2) Dependencia de conectividad a internet / disponibilidad del servicio en la nube.\n" +
      "3) Errores de digitación o registros incompletos al migrar de papel/Excel al portal.\n" +
      "4) Pérdida temporal de acceso por fallas de autenticación, permisos o configuración de roles.\n" +
      "5) Duplicidad de información si se mantiene en paralelo el método anterior sin fecha de corte.\n" +
      "6) Riesgo de confidencialidad si no se gestionan correctamente usuarios y contraseñas compartidas.",
    oportunidades:
      "1) Centralizar en un solo lugar cronogramas PM, correctivos, hojas de vida, solicitudes e indicadores.\n" +
      "2) Visibilidad en tiempo real del estado de solicitudes y PM para jefes y dirección.\n" +
      "3) Trazabilidad y generación de formatos SGC desde el navegador, fortaleciendo el sistema de gestión.\n" +
      "4) Roles diferenciados: solicitantes reportan fallas; mantenimiento atiende; consulta solo lectura.\n" +
      "5) Reducir tiempos de respuesta al correctivo y mejorar el cumplimiento de PM (>=95%).\n" +
      "6) Base para mejora continua, control de competencias (matriz) y evidencia auditable.",
    requisitosLegales:
      "Aplica el Sistema de Gestión de Calidad de la organización (ISO 9001) en lo referente a control de información documentada, control de cambios y mejora continua.\n" +
      "No se identifican requisitos legales específicos adicionales para la puesta en marcha del software interno; se deben respetar políticas internas de uso de TI, protección de datos personales de usuarios del portal y buenas prácticas de seguridad de la información.\n" +
      "Si algún espacio no aplica de forma particular: N/A para requisitos sectoriales externos no relacionados.",
    impacto:
      "Proceso: cambia la forma de programar, registrar y consultar mantenimientos preventivos/correctivos y solicitudes de área; se reduce el uso de archivos locales como fuente oficial.\n" +
      "Personas: requiere capacitación de técnicos, líderes de área (solicitantes) y roles de consulta/admin; el Coordinador de Mantenimiento lidera la adopción.\n" +
      "Tecnología: uso de navegador web, hosting del portal y base de datos Supabase; fotos de máquinas en Storage.\n" +
      "Documentación SGC: se integran/generan formatos GC-RE-001, GC-RE-009, MT-RE-045, GH-RE-030 y este GC-RE-027.\n" +
      "Indicadores: facilita el seguimiento de cumplimiento PM, tiempos de respuesta y acciones de mejora.\n" +
      "Impacto económico: bajo (desarrollo ya realizado); retorno esperado en trazabilidad, tiempo y cumplimiento.",
    plan: [
      {
        actividad:
          "Presentar el Portal de Mantenimiento EPI a Dirección y Líder SGC (demostración en vivo).",
        responsable: "Coordinador de Mantenimiento / Juan Manuel Moncayo",
        comunicar: "Dirección, Líder SGC, jefes de área",
        fechaEjecucion: "2026-07-15",
        fechaSeguimiento: "2026-07-22",
      },
      {
        actividad:
          "Ejecutar fase piloto (4 semanas) con registro real de PM, correctivos y solicitudes por área.",
        responsable: "Juan Manuel Moncayo / Equipo de mantenimiento",
        comunicar: "Personal de mantenimiento y líderes de área piloto",
        fechaEjecucion: "2026-07-09",
        fechaSeguimiento: "2026-08-15",
      },
      {
        actividad:
          "Crear usuarios portal (admin, operador, consulta, solicitante) y capacitar en roles y flujos.",
        responsable: "Coordinador de Mantenimiento",
        comunicar: "Usuarios del portal / líderes de área",
        fechaEjecucion: "2026-07-20",
        fechaSeguimiento: "2026-08-30",
      },
      {
        actividad:
          "Oficializar el portal como herramienta del SGC y definir fecha de corte del método anterior (Excel/papel).",
        responsable: "Coordinador de Mantenimiento / Líder SGC",
        comunicar: "Todas las áreas de planta",
        fechaEjecucion: "2026-09-15",
        fechaSeguimiento: "2026-10-31",
      },
      {
        actividad:
          "Desplegar en todas las áreas y verificar tablero de solicitudes, hojas de vida e Inicio (PM).",
        responsable: "Juan Manuel Moncayo",
        comunicar: "Solicitantes de área y mantenimiento",
        fechaEjecucion: "2026-08-15",
        fechaSeguimiento: "2026-10-31",
      },
      {
        actividad:
          "Evaluar eficacia a 3 meses (indicadores PM, tiempos correctivo, adopción) e informar a Dirección.",
        responsable: "Líder SGC / Dirección de Producción",
        comunicar: "Dirección y proceso de Mantenimiento",
        fechaEjecucion: "2026-11-15",
        fechaSeguimiento: "2026-12-31",
      },
    ],
  });
}
