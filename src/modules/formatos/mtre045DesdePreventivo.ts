import type { HojaVida } from "../hojas/types";
import { coincideArea } from "../../lib/areas";
import { nombresPersonalEnRegistro, idsDesdeRegistroPreventivo } from "../personal/personalVinculo";
import type { Persona } from "../personal/types";
import type { RegistroPreventivo } from "../preventivo/types";
import { extraerCamposFormato, type CamposFormatoMtre045 } from "./Mtre045CamposFormulario";
import { formularioMtre045Vacio, type Mtre045Datos } from "./mtre045Types";

/** Campos que siempre se sincronizan desde el registro PM (no quedan desactualizados). */
const CAMPOS_DESDE_PM = [
  "numeroReporte",
  "fecha",
  "equipo",
  "codigo",
  "marca",
  "serie",
  "area",
  "actividadRealizada",
  "responsableMantenimiento",
] as const;

export function etiquetaEquipoPm(nombre: string, codigo?: string | null): string {
  const cod = (codigo ?? "").trim();
  if (!cod) return nombre;
  return `${nombre} (${cod})`;
}

export function datosEquipoDesdeHoja(
  hoja: HojaVida | undefined,
  registro: RegistroPreventivo,
): Pick<Mtre045Datos, "equipo" | "codigo" | "marca" | "serie" | "area"> {
  const nombre = hoja?.nombre ?? registro.datos.equipo ?? "";
  const codigo = hoja?.codigo ?? registro.datos.codigo ?? "";
  return {
    equipo: etiquetaEquipoPm(nombre, codigo),
    codigo,
    marca: hoja?.datos.marca ?? registro.datos.marca ?? "",
    serie: hoja?.datos.serial ?? registro.datos.serial ?? "",
    area: registro.area,
  };
}

export function construirMtre045DesdePreventivo(
  registro: RegistroPreventivo,
  hoja: HojaVida | undefined,
  personal: Persona[],
  opciones?: { numeroReporte?: string },
): Mtre045Datos {
  const equipoDatos = datosEquipoDesdeHoja(hoja, registro);
  const tecnicos = nombresPersonalEnRegistro(
    idsDesdeRegistroPreventivo(registro),
    personal,
    registro.datos.personalNombres,
  );

  const numeroReporte =
    opciones?.numeroReporte ??
    registro.datos.numeroReporte ??
    registro.datos.mtre045?.numeroReporte ??
    "";

  const desdePm: Mtre045Datos = {
    ...formularioMtre045Vacio(),
    preventivoId: registro.id,
    numeroReporte,
    fecha: registro.fecha,
    ...equipoDatos,
    actividadRealizada: registro.descripcion ?? "",
    responsableMantenimiento: tecnicos,
  };

  if (!registro.datos.mtre045) {
    return desdePm;
  }

  const guardado = registro.datos.mtre045;
  const fusionado: Mtre045Datos = { ...guardado, ...desdePm, preventivoId: registro.id };
  for (const campo of CAMPOS_DESDE_PM) {
    fusionado[campo] = desdePm[campo];
  }
  // Conservar repuestos, verificación, firmas y responsable de verificación del PM
  return completarFirmaVerificacion(registro, {
    ...fusionado,
    ...extraerCamposFormato(guardado),
    firmaMantenimiento: guardado.firmaMantenimiento,
    firmaVerificacion: guardado.firmaVerificacion,
  });
}

export function nombreYCodigoPm(
  registro: RegistroPreventivo,
  hoja: HojaVida | undefined,
): { nombre: string; codigo: string } {
  const nombre = hoja?.nombre ?? registro.datos.equipo ?? "Sin nombre";
  const codigo = (hoja?.codigo ?? registro.datos.codigo ?? "").trim() || "—";
  return { nombre, codigo };
}

/** Arma el MT-RE-045 completo al guardar el registro preventivo. */
export function construirMtre045AlGuardar(params: {
  preventivoId: string;
  maquina: HojaVida;
  fecha: string;
  descripcion: string;
  personalIds: string[];
  personal: Persona[];
  formato: CamposFormatoMtre045;
  numeroReporte: string;
  firmaMantenimiento?: string | null;
  firmaVerificacion?: string | null;
}): Mtre045Datos {
  const tecnicos = nombresPersonalEnRegistro(
    params.personalIds,
    params.personal,
    undefined,
  );

  return {
    ...formularioMtre045Vacio(),
    ...params.formato,
    preventivoId: params.preventivoId,
    numeroReporte: params.numeroReporte,
    fecha: params.fecha,
    equipo: etiquetaEquipoPm(params.maquina.nombre, params.maquina.codigo),
    codigo: params.maquina.codigo ?? "",
    marca: params.maquina.datos?.marca ?? "",
    serie: params.maquina.datos?.serial ?? "",
    area: params.maquina.area,
    actividadRealizada: params.descripcion,
    responsableMantenimiento: tecnicos,
    ...(params.firmaMantenimiento
      ? { firmaMantenimiento: params.firmaMantenimiento }
      : {}),
    ...(params.firmaVerificacion
      ? { firmaVerificacion: params.firmaVerificacion }
      : {}),
  };
}

/**
 * Reportes ya aprobados que guardaron el área como firmante.
 * Se rehacen al imprimir para que salgan con el nombre de la firma.
 */
const FORMATOS_REHACER: { fecha: string; numero: string; equipo: string; firmante: string }[] = [
  {
    fecha: "2026-05-21",
    numero: "10",
    equipo: "PC 32",
    firmante: "Juan Guillermo Alvarez",
  },
  {
    fecha: "2026-05-21",
    numero: "11",
    equipo: "PC 33",
    firmante: "Juan Guillermo Alvarez",
  },
];

function numeroPlano(registro: RegistroPreventivo): string {
  const texto = String(
    registro.datos.numeroReporte ?? registro.datos.mtre045?.numeroReporte ?? "",
  ).trim();
  return texto.replace(/^0+/, "") || texto;
}

export function datosRehaceFormato(registro: RegistroPreventivo): RegistroPreventivo["datos"] | null {
  const base = registro.datos.mtre045;
  if (!base) return null;
  const equipo = registro.datos.equipo ?? base.equipo ?? "";
  const regla = FORMATOS_REHACER.find(
    (item) =>
      registro.fecha === item.fecha &&
      numeroPlano(registro) === item.numero &&
      equipo.includes(item.equipo),
  );
  if (!regla) return null;
  if (
    base.responsableVerificacion?.trim() === regla.firmante &&
    registro.datos.aprobadoPorNombre?.trim() === regla.firmante
  ) {
    return null;
  }
  const firma = base.firmaVerificacion || registro.datos.firmaAprobacion;
  return {
    ...registro.datos,
    aprobadoPorNombre: regla.firmante,
    mtre045: {
      ...formularioMtre045Vacio(),
      ...base,
      numeroReporte: base.numeroReporte || registro.datos.numeroReporte || regla.numero,
      responsableVerificacion: regla.firmante,
      ...(firma ? { firmaVerificacion: firma } : {}),
    },
  };
}

/** Si el formato viejo guardó el área como firmante, usa el nombre de quien aprobó. */
export function mtre045ParaImprimir(registro: RegistroPreventivo): Mtre045Datos | null {
  const rehecho = datosRehaceFormato(registro);
  const base = rehecho?.mtre045 ?? registro.datos.mtre045;
  if (!base) return null;
  const origen = rehecho ? { ...registro, datos: rehecho } : registro;
  return completarFirmaVerificacion(origen, { ...base });
}

function completarFirmaVerificacion(
  registro: RegistroPreventivo,
  datos: Mtre045Datos,
): Mtre045Datos {
  const area = (datos.area || registro.area || "").trim();
  const guardado = (datos.responsableVerificacion || "").trim();
  const nombreAprobador = (registro.datos.aprobadoPorNombre || "").trim();
  const verificador =
    nombreAprobador && (!guardado || coincideArea(guardado, area))
      ? nombreAprobador
      : guardado;
  const firma = datos.firmaVerificacion || registro.datos.firmaAprobacion;
  return {
    ...datos,
    numeroReporte: datos.numeroReporte || registro.datos.numeroReporte || "",
    responsableVerificacion: verificador,
    ...(firma ? { firmaVerificacion: firma } : {}),
  };
}
