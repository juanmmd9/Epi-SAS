export type VerificacionAn = "A" | "NA" | "";

export interface Mtre045Datos {
  numeroReporte: string;
  fecha: string;
  equipo: string;
  marca: string;
  serie: string;
  area: string;
  actividadRealizada: string;
  cambioRepuestos: string;
  verificacionEquipoPm: string;
  actividadCorrectivo: string;
  cambioRepuestosCorrectivo: string;
  verificacionCorrectivo: string;
  inspeccionVisual: VerificacionAn;
  pruebasFuncionamiento: VerificacionAn;
  noAprobo: string;
  responsableMantenimiento: string;
  responsableVerificacion: string;
  preventivoId?: string;
}

export interface PrefillMtre045DesdePreventivo {
  preventivoId: string;
  numeroReporte: string;
  fecha: string;
  equipo: string;
  marca: string;
  serie: string;
  area: string;
  actividadRealizada: string;
  responsableMantenimiento: string;
  mtre045?: Mtre045Datos;
}

export function formularioMtre045Vacio(): Mtre045Datos {
  return {
    numeroReporte: "",
    fecha: new Date().toISOString().slice(0, 10),
    equipo: "",
    marca: "",
    serie: "",
    area: "",
    actividadRealizada: "",
    cambioRepuestos: "",
    verificacionEquipoPm: "",
    actividadCorrectivo: "",
    cambioRepuestosCorrectivo: "",
    verificacionCorrectivo: "",
    inspeccionVisual: "",
    pruebasFuncionamiento: "",
    noAprobo: "",
    responsableMantenimiento: "",
    responsableVerificacion: "",
  };
}

export function prefillMtre045DesdePreventivo(
  datos: PrefillMtre045DesdePreventivo,
): Mtre045Datos {
  if (datos.mtre045) {
    return { ...datos.mtre045, preventivoId: datos.preventivoId };
  }
  return {
    ...formularioMtre045Vacio(),
    preventivoId: datos.preventivoId,
    numeroReporte: datos.numeroReporte,
    fecha: datos.fecha,
    equipo: datos.equipo,
    marca: datos.marca,
    serie: datos.serie,
    area: datos.area,
    actividadRealizada: datos.actividadRealizada,
    responsableMantenimiento: datos.responsableMantenimiento,
  };
}

export function fechaPartes(fechaIso: string): { dia: string; mes: string; anio: string } {
  if (!fechaIso) return { dia: "", mes: "", anio: "" };
  const [anio, mes, dia] = fechaIso.split("-");
  return { dia: dia ?? "", mes: mes ?? "", anio: anio ?? "" };
}

export function fechaDesdePartes(dia: string, mes: string, anio: string): string {
  const d = dia.padStart(2, "0");
  const m = mes.padStart(2, "0");
  const a = anio.trim();
  if (!d || !m || !a || d === "00" || m === "00") return "";
  return `${a}-${m}-${d}`;
}

export function esFechaValida(fechaIso: string): boolean {
  if (!fechaIso) return false;
  const fecha = new Date(`${fechaIso}T12:00:00`);
  return !Number.isNaN(fecha.getTime());
}
