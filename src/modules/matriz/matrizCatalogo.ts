import type { CompetenciaCatalogoInput } from "./types";

const CAT_GENERAL =
  "Generalidades en el sistema (Conocimientos básicos — técnico mecánico)";
const CAT_CALIDAD =
  "Calidad, no conformidades, seguridad y ambiente";

/** Catálogo oficial extraído de MATRIZ_DE_CONOCMIENTOS_Y_HABILIDADES_MANTENIMIENTO.xls */
export const CATALOGO_MECANICO: CompetenciaCatalogoInput[] = [
  { orden: 1, numero: 1, categoria: CAT_GENERAL, descripcion: "Conoce los procedimientos e instructivos del área de mantenimiento mecánico", meta_d: 2, experto: "Sandra Angel" },
  { orden: 2, numero: 2, categoria: CAT_GENERAL, descripcion: "Sabe cuál es la diferencia entre un mantenimiento preventivo y uno correctivo", meta_d: 2 },
  { orden: 3, numero: 3, categoria: CAT_GENERAL, descripcion: "Comprende los formatos de reportes del área de mantenimiento", meta_d: 2 },
  { orden: 4, numero: 4, categoria: CAT_GENERAL, descripcion: "Conoce los indicadores del área de mantenimiento", meta_d: 2 },
  { orden: 5, numero: 5, categoria: CAT_GENERAL, descripcion: "Conoce y además interpreta las fichas técnicas de las máquinas que operan mecánicamente en las áreas", meta_d: 2 },
  { orden: 6, numero: 6, categoria: CAT_GENERAL, descripcion: "Sabe y aplica el estándar de limpieza para las máquinas y su área de trabajo", meta_d: 2 },
  { orden: 7, numero: 7, categoria: CAT_GENERAL, descripcion: "Conoce y aplica todos los pasos para realizar un mantenimiento correctivo mecánico", meta_d: 3 },
  { orden: 8, numero: 8, categoria: CAT_GENERAL, descripcion: "Conoce y aplica todos los pasos para realizar un mantenimiento preventivo mecánico", meta_d: 3, experto: "Guillermo Bravo", herramienta: "Instructivo de operación del Manómetro", estado_capacitacion: "En proceso" },
  { orden: 9, numero: 9, categoria: CAT_GENERAL, descripcion: "Identifica los mecanismos (piñones) en la maquinaria", meta_d: 2, experto: "Sandra Angel", herramienta: "LUP", estado_capacitacion: "Pendiente" },
  { orden: 10, numero: 10, categoria: CAT_GENERAL, descripcion: "Identifica los mecanismos (correas) en la maquinaria", meta_d: 2, experto: "Guillermo Bravo", herramienta: "LUP", estado_capacitacion: "Pendiente" },
  { orden: 11, numero: 11, categoria: CAT_GENERAL, descripcion: "Sabe de medidas en centímetros y pulgadas (sistema métrico y americano)", meta_d: 2 },
  { orden: 12, numero: 12, categoria: CAT_GENERAL, descripcion: "Identifica las referencias de las balineras", meta_d: 2, experto: "Alejandro Ospina" },
  { orden: 13, numero: 13, categoria: CAT_GENERAL, descripcion: "Conoce el manejo de las herramientas manuales", meta_d: 3, experto: "Guillermo Bravo", herramienta: "LUP", estado_capacitacion: "Pendiente" },
  { orden: 14, numero: 14, categoria: CAT_GENERAL, descripcion: "Diagnostica las posibles averías de los equipos y detecta el origen.", meta_d: 3 },
  { orden: 15, numero: 15, categoria: CAT_GENERAL, descripcion: "Organiza y planifica las actividades de mantenimiento", meta_d: 2 },
  { orden: 16, numero: 16, categoria: CAT_GENERAL, descripcion: "Cuenta con un enfoque lógico y metódico para la solución de problemas.", meta_d: 3 },
  { orden: 17, numero: 17, categoria: CAT_GENERAL, descripcion: "Repara, instala, mantiene y ajusta la maquinaria y equipos utilizados para producción.", meta_d: 3 },
  { orden: 18, numero: 18, categoria: CAT_GENERAL, descripcion: "Examina, ajusta, desmonta, reconstruye y reemplaza las piezas mecánicas defectuosas en la maquinaria y equipos", meta_d: 3 },
  { orden: 19, numero: 15, categoria: CAT_CALIDAD, descripcion: "Conoce las no conformidades de su proceso", meta_d: 2 },
  { orden: 20, numero: 16, categoria: CAT_CALIDAD, descripcion: "Identifica las causas de las no conformidades", meta_d: 2, herramienta: "TABLA DE CRITERIOS DE ACEPTACION", estado_capacitacion: "EJECUTADO" },
  { orden: 21, numero: 17, categoria: CAT_CALIDAD, descripcion: "Sabe cómo prevenir las no conformidades de su proceso", meta_d: 2 },
  { orden: 22, numero: 18, categoria: CAT_CALIDAD, descripcion: "Conoce el estándar de limpieza del área", meta_d: 2 },
  { orden: 23, numero: 19, categoria: CAT_CALIDAD, descripcion: "Diligencia de manera correcta el formato de reporte de los mantenimientos preventivos y correctivos", meta_d: 2 },
  { orden: 24, numero: 21, categoria: CAT_CALIDAD, descripcion: "Identifica a quién reportar las no conformidades del proceso.", meta_d: 2 },
  { orden: 25, numero: 22, categoria: CAT_CALIDAD, descripcion: "Conoce y aplica el estándar de limpieza de la máquina (TPM básico).", meta_d: 3 },
  { orden: 26, numero: 23, categoria: CAT_CALIDAD, descripcion: "Conoce y aplica el estándar de almacenamiento de los repuesto y herramientas", meta_d: 2 },
  { orden: 27, numero: 24, categoria: CAT_CALIDAD, descripcion: "Conoce la disposición final de los deshechos que se presentan durante los mantenimientos", meta_d: 2, herramienta: "LUP" },
  { orden: 28, numero: 25, categoria: CAT_CALIDAD, descripcion: "Identifica los elementos de protección personal que requiere para el proceso.", meta_d: 2 },
  { orden: 29, numero: 26, categoria: CAT_CALIDAD, descripcion: "Utiliza los elementos de protección personal que requiere para el proceso.", meta_d: 2 },
  { orden: 30, numero: 27, categoria: CAT_CALIDAD, descripcion: "Identifica el estado de las herramientas y solicita el cambio de las mismas cuando se requiere.", meta_d: 3 },
  { orden: 31, numero: 28, categoria: CAT_CALIDAD, descripcion: "Conoce la forma correcta del uso de las herramientas y demás elementos al momento de limpieza y lubricación de su máquina.", meta_d: 3 },
  { orden: 32, numero: 29, categoria: CAT_CALIDAD, descripcion: "Sabe la diferencia entre un incidente y un accidente", meta_d: 2 },
  { orden: 33, numero: 30, categoria: CAT_CALIDAD, descripcion: "Sabe a quién reportar un incidente y un accidente", meta_d: 2 },
  { orden: 34, numero: 31, categoria: CAT_CALIDAD, descripcion: "Sabe qué hacer y a donde dirigirse en caso de un accidente.", meta_d: 2 },
  { orden: 35, numero: 32, categoria: CAT_CALIDAD, descripcion: "Cumple y hace cumplir los estándares de seguridad de las máquina teniendo en cuenta los componentes de funcionamiento adecuado.", meta_d: 2 },
];

export const HOJAS_MATRIZ = [{ clave: "MECANICO" as const, etiqueta: "Mantenimiento mecánico" }];
