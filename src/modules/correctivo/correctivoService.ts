import { supabase } from "../../services/supabase";
import type { CorrectivoInput, RegistroCorrectivo } from "./types";

const TABLA = "correctivo";

export async function listarCorrectivo(): Promise<RegistroCorrectivo[]> {
  const { data, error } = await supabase
    .from(TABLA)
    .select("*")
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistroCorrectivo[];
}

export async function crearCorrectivo(input: CorrectivoInput): Promise<RegistroCorrectivo> {
  const { personal_id, ...resto } = input;
  const payload: Record<string, unknown> = { ...resto };
  if (personal_id) payload.personal_id = personal_id;

  let { data, error } = await supabase.from(TABLA).insert(payload).select().single();
  if (error && personal_id && /personal_id|personal/i.test(error.message)) {
    ({ data, error } = await supabase.from(TABLA).insert(resto).select().single());
  }
  if (error) throw new Error(error.message);
  return data as RegistroCorrectivo;
}

export async function actualizarCorrectivo(
  id: string,
  input: CorrectivoInput,
): Promise<RegistroCorrectivo> {
  const { personal_id, ...resto } = input;
  const payload: Record<string, unknown> = { ...resto };
  if (personal_id) payload.personal_id = personal_id;

  let { data, error } = await supabase.from(TABLA).update(payload).eq("id", id).select().single();
  if (error && personal_id && /personal_id|personal/i.test(error.message)) {
    ({ data, error } = await supabase.from(TABLA).update(resto).eq("id", id).select().single());
  }
  if (error) throw new Error(error.message);
  return data as RegistroCorrectivo;
}

export async function eliminarCorrectivo(id: string): Promise<void> {
  const { error } = await supabase.from(TABLA).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

function minutosDesdeMedianoche(hora: string | undefined): number | null {
  if (!hora || !/^\d{2}:\d{2}/.test(hora)) return null;
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function calcularTiempoRespuesta(horaInicio?: string, horaFin?: string): string {
  const inicio = minutosDesdeMedianoche(horaInicio);
  const fin = minutosDesdeMedianoche(horaFin);
  if (inicio === null || fin === null) return "";
  let diferencia = fin - inicio;
  if (diferencia < 0) diferencia += 24 * 60;
  const horas = Math.floor(diferencia / 60);
  const mins = diferencia % 60;
  if (horas === 0) return `${mins} min`;
  return `${horas} h ${mins} min`;
}

export function siguienteNumeroSolicitud(registros: RegistroCorrectivo[]): number {
  const maximo = registros.reduce(
    (max, r) => Math.max(max, r.datos.numeroSolicitud || 0),
    0,
  );
  return maximo + 1;
}

const COLUMNAS_CSV: { clave: keyof import("./types").CorrectivoDatos | "area" | "fecha"; titulo: string }[] = [
  { clave: "numeroSolicitud", titulo: "No. solicitud" },
  { clave: "fecha", titulo: "Fecha solicitud" },
  { clave: "horaSolicitud", titulo: "Hora solicitud" },
  { clave: "nombreSolicitante", titulo: "Solicitante" },
  { clave: "horaRespuesta", titulo: "Hora respuesta" },
  { clave: "tiempoRespuesta", titulo: "Tiempo respuesta" },
  { clave: "horaInicioSolicitud", titulo: "Hora inicio" },
  { clave: "horaFinSolicitud", titulo: "Hora fin" },
  { clave: "area", titulo: "Proceso/Area" },
  { clave: "maquinaEquipoLocacion", titulo: "Maquina/Equipo/Locacion" },
  { clave: "codigoMaquina", titulo: "Codigo" },
  { clave: "estadoMaquina", titulo: "Estado maquina" },
  { clave: "tiposSolicitud", titulo: "Tipo solicitud" },
  { clave: "descripcionSolicitud", titulo: "Descripcion" },
  { clave: "solucionSolicitud", titulo: "Solucion" },
  { clave: "fechaCierre", titulo: "Fecha cierre" },
  { clave: "horaCierre", titulo: "Hora cierre" },
  { clave: "quienRevisa", titulo: "Quien revisa" },
];

export function exportarCsv(registros: RegistroCorrectivo[]): void {
  function celda(valor: unknown): string {
    const texto = Array.isArray(valor) ? valor.join(" / ") : String(valor ?? "");
    return '"' + texto.replaceAll('"', '""') + '"';
  }

  const encabezado = COLUMNAS_CSV.map((c) => celda(c.titulo)).join(";");
  const filas = registros.map((registro) =>
    COLUMNAS_CSV.map((columna) => {
      if (columna.clave === "area") return celda(registro.area);
      if (columna.clave === "fecha") return celda(registro.fecha);
      return celda(registro.datos[columna.clave]);
    }).join(";"),
  );

  const contenido = "\uFEFF" + [encabezado, ...filas].join("\r\n");
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `correctivo_${new Date().toISOString().slice(0, 10)}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}
