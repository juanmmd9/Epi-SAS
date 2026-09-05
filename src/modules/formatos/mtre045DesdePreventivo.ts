import type { HojaVida } from "../hojas/types";
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
  return {
    ...fusionado,
    ...extraerCamposFormato(guardado),
    firmaMantenimiento: guardado.firmaMantenimiento,
    firmaVerificacion: guardado.firmaVerificacion,
  };
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
