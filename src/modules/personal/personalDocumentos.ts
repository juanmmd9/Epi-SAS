export const APARTADOS_FICHA = [
  {
    id: "hoja_vida",
    titulo: "Hoja de vida",
    detalle: "Currículum y soportes de experiencia.",
  },
  {
    id: "evaluaciones",
    titulo: "Evaluaciones",
    detalle: "Evaluaciones de desempeño y periodos de prueba.",
  },
  {
    id: "estudios",
    titulo: "Documentos de estudio",
    detalle: "Diplomas, actas y títulos.",
  },
  {
    id: "certificados",
    titulo: "Certificados y cursos",
    detalle: "Alturas, electricidad, soldadura, lockout y otros cursos.",
  },
  {
    id: "examenes",
    titulo: "Exámenes médicos",
    detalle: "Aptitud laboral y exámenes ocupacionales.",
  },
  {
    id: "ingreso",
    titulo: "Contrato y afiliaciones",
    detalle: "Contrato, cédula, EPS, ARL y pensión.",
  },
  {
    id: "dotacion",
    titulo: "Dotación y EPP",
    detalle: "Entrega de uniforme, botas, guantes y protección.",
  },
  {
    id: "licencias",
    titulo: "Licencias y carnets",
    detalle: "Conducción, montacargas y carnets vigentes.",
  },
  {
    id: "sst",
    titulo: "Inducción y seguridad",
    detalle: "Inducción SST, reglamento interno y permisos de trabajo.",
  },
] as const;

export type TipoDocumentoPersonal = (typeof APARTADOS_FICHA)[number]["id"];

export interface DocumentoPersonal {
  id: string;
  personal_id: string;
  tipo: TipoDocumentoPersonal;
  nombre: string;
  url: string;
  subido_en: string;
}

export function esTipoDocumentoPersonal(valor: string): valor is TipoDocumentoPersonal {
  return APARTADOS_FICHA.some((apartado) => apartado.id === valor);
}
