export type VerificacionAn = "A" | "NA" | "";

export interface Mtre045Datos {
  numeroReporte: string;
  fecha: string;
  equipo: string;
  codigo: string;
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
  codigo: string;
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
    codigo: "",
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
  const desdePm: Mtre045Datos = {
    ...formularioMtre045Vacio(),
    preventivoId: datos.preventivoId,
    numeroReporte: datos.numeroReporte,
    fecha: datos.fecha,
    equipo: datos.equipo,
    codigo: datos.codigo,
    marca: datos.marca,
    serie: datos.serie,
    area: datos.area,
    actividadRealizada: datos.actividadRealizada,
    responsableMantenimiento: datos.responsableMantenimiento,
  };

  if (!datos.mtre045) return desdePm;

  return {
    ...datos.mtre045,
    ...desdePm,
    cambioRepuestos: datos.mtre045.cambioRepuestos,
    verificacionEquipoPm: datos.mtre045.verificacionEquipoPm,
    actividadCorrectivo: datos.mtre045.actividadCorrectivo,
    cambioRepuestosCorrectivo: datos.mtre045.cambioRepuestosCorrectivo,
    verificacionCorrectivo: datos.mtre045.verificacionCorrectivo,
    inspeccionVisual: datos.mtre045.inspeccionVisual,
    pruebasFuncionamiento: datos.mtre045.pruebasFuncionamiento,
    noAprobo: datos.mtre045.noAprobo,
    responsableVerificacion: datos.mtre045.responsableVerificacion,
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
