import { supabase } from "../../services/supabase";
import { aFechaIso } from "../../lib/fechas";
import { generarPdfGcRe009, nombreArchivoPdf } from "../formatos/gcre009Pdf";
import {
  filaPlanVacia,
  filaSeguimientoVacia,
  normalizarDatosNc,
  type OrigenNc,
  type RegistroNcDatos,
} from "../formatos/types";
import type {
  CorrectivoVanilla,
  DatosRespaldoV2,
  HojaVanilla,
  NoConformidadVanilla,
  OpcionesImportacion,
  PreventivoVanilla,
  ResultadoImportacion,
} from "./types";

const BUCKET_ADJUNTOS = "adjuntos-preventivo";
const BUCKET_NC = "pdfs-nc";

async function subirBytes(
  bucket: string,
  ruta: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(ruta, bytes, { contentType, upsert: true });
  if (error) throw new Error(error.message);
  return supabase.storage.from(bucket).getPublicUrl(ruta).data.publicUrl;
}

async function subirDesdeDataUrl(
  dataUrl: string,
  bucket: string,
  carpeta: string,
  nombreFallback: string,
): Promise<string | null> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;
  const [header, base64] = dataUrl.split(",");
  if (!base64) return null;
  const mime = header.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
  let ext = "bin";
  if (mime.includes("pdf")) ext = "pdf";
  else if (mime.includes("png")) ext = "png";
  else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
  else if (mime.includes("word")) ext = "docx";
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const ruta = `${carpeta}/${nombreFallback.replace(/[^\w.-]+/g, "_")}-${crypto.randomUUID()}.${ext}`;
  return subirBytes(bucket, ruta, bytes, mime);
}

export async function vaciarDatosSupabase(): Promise<void> {
  const tablas = [
    "preventivo",
    "cronograma",
    "cronograma_excepciones",
    "correctivo",
    "no_conformidades",
    "horas_programadas",
    "hojas_vida",
  ] as const;

  for (const tabla of tablas) {
    const { error } = await supabase.from(tabla).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(`No se pudo vaciar ${tabla}: ${error.message}`);
  }
}

function mapearHoja(registro: HojaVanilla, fotoUrl: string | null) {
  const fechaBaja =
    typeof registro.fechaBajaCirculacion === "string" ? registro.fechaBajaCirculacion : "";
  const activa = fechaBaja ? false : registro.activa !== false;
  return {
    codigo: registro.codigo?.trim() || null,
    nombre: registro.nombre?.trim() || "Sin nombre",
    area: registro.area || "Sin area",
    frecuencia_pm_meses:
      Number.parseInt(String(registro.frecuenciaPreventivoMeses), 10) > 0
        ? Number.parseInt(String(registro.frecuenciaPreventivoMeses), 10)
        : 12,
    primer_pm: registro.fechaPrimerPreventivo || null,
    activa,
    foto_url: fotoUrl,
    datos: {
      marca: registro.marca,
      modelo: registro.modelo,
      serial: registro.serial,
      ubicacion: registro.ubicacion,
      fechaBaja: fechaBaja || undefined,
      motivoBaja: registro.motivoBaja?.trim() || undefined,
    },
  };
}

function mapearCorrectivo(registro: CorrectivoVanilla, mapaHojas: Map<string, string>) {
  const tipos = Array.isArray(registro.tiposSolicitud)
    ? registro.tiposSolicitud
    : registro.tipoSolicitud
      ? [registro.tipoSolicitud]
      : [];
  const maquinaId = registro.maquinaId ? mapaHojas.get(registro.maquinaId) ?? "" : "";
  const area = registro.proceso || registro.area || "Sin area";
  const fecha = (registro.fechaSolicitud || registro.fecha || "").slice(0, 10);

  return {
    area,
    fecha: fecha || new Date().toISOString().slice(0, 10),
    datos: {
      numeroSolicitud: Number.parseInt(String(registro.numeroSolicitud), 10) || 0,
      horaSolicitud: registro.horaSolicitud || "",
      nombreSolicitante: registro.nombreSolicitante || "",
      horaRespuesta: registro.horaRespuesta || "",
      tiempoRespuesta: registro.tiempoRespuesta || "",
      horaInicioSolicitud: registro.horaInicioSolicitud || "",
      horaFinSolicitud: registro.horaFinSolicitud || "",
      maquinaEquipoLocacion:
        registro.maquinaEquipoLocacion || registro.equipo || registro.falla || "",
      codigoMaquina: registro.codigoMaquina || "",
      maquinaId,
      estadoMaquina: registro.estadoMaquina || "",
      tiposSolicitud: tipos,
      descripcionSolicitud:
        registro.descripcionSolicitud || registro.actividad || registro.falla || "",
      solucionSolicitud: registro.solucionSolicitud || "",
      fechaCierre: registro.fechaCierre || "",
      horaCierre: registro.horaCierre || "",
      quienRevisa: registro.quienRevisa || "",
    },
  };
}

function mapearNc(registro: NoConformidadVanilla): RegistroNcDatos {
  return normalizarDatosNc({
    area: registro.area || "",
    fechaDeteccion: registro.fechaDeteccion || new Date().toISOString().slice(0, 10),
    origen: (registro.origen as OrigenNc) || "proceso",
    origenIndicador: (registro.origenIndicador as RegistroNcDatos["origenIndicador"]) ?? null,
    descripcion: registro.descripcion || "",
    detectadaPorNombre: registro.detectadaPorNombre || "",
    detectadaPorCargo: registro.detectadaPorCargo || "",
    tratamientoInmediato: registro.tratamientoInmediato || "",
    tratamientoInmediatoPor: registro.tratamientoInmediatoPor || "",
    tratamientoInmediatoFecha: registro.tratamientoInmediatoFecha || "",
    herramientaCausa: registro.herramientaCausa || "",
    resumenCausa: registro.resumenCausa || "",
    analisisPor: registro.analisisPor || "",
    analisisFecha: registro.analisisFecha || "",
    requiereAccionFormal: (registro.requiereAccionFormal as RegistroNcDatos["requiereAccionFormal"]) || "",
    planAccion: (registro.planAccion as RegistroNcDatos["planAccion"]) ?? [filaPlanVacia(), filaPlanVacia()],
    seguimientoCumplimiento: registro.seguimientoCumplimiento || "",
    seguimientoEficacia: registro.seguimientoEficacia || "",
    seguimientoFilas:
      (registro.seguimientoFilas as RegistroNcDatos["seguimientoFilas"]) ?? [
        filaSeguimientoVacia(),
        filaSeguimientoVacia(),
      ],
    verificadoPorNombre: registro.verificadoPorNombre || "",
    verificadoPorCargo: registro.verificadoPorCargo || "",
    tratamientoEficaz: (registro.tratamientoEficaz as RegistroNcDatos["tratamientoEficaz"]) || "",
    tratamientoEficazPorque: registro.tratamientoEficazPorque || "",
  });
}

async function importarHojas(
  lista: HojaVanilla[],
  mapaHojas: Map<string, string>,
  advertencias: string[],
): Promise<number> {
  let importadas = 0;
  for (const registro of lista) {
    if (!registro?.id || !registro.nombre) continue;
    let fotoUrl: string | null = null;
    if (registro.foto?.startsWith("data:")) {
      try {
        fotoUrl = await subirDesdeDataUrl(
          registro.foto,
          BUCKET_ADJUNTOS,
          "fotos-hojas",
          registro.codigo || registro.nombre,
        );
      } catch {
        advertencias.push(`No se pudo subir la foto de ${registro.nombre}.`);
      }
    }
    const { data, error } = await supabase
      .from("hojas_vida")
      .insert(mapearHoja(registro, fotoUrl))
      .select("id")
      .single();
    if (error) {
      advertencias.push(`Hoja ${registro.nombre}: ${error.message}`);
      continue;
    }
    mapaHojas.set(registro.id, data.id);
    importadas += 1;
  }
  return importadas;
}

async function importarExcepciones(
  data: DatosRespaldoV2,
  mapaHojas: Map<string, string>,
  advertencias: string[],
): Promise<number> {
  let importadas = 0;
  const excepciones = data.excepcionesCronograma ?? [];
  for (const item of excepciones) {
    const hojaId = mapaHojas.get(item.maquinaId);
    if (!hojaId) {
      advertencias.push(`Excepcion omitida: maquina ${item.maquinaId} no encontrada.`);
      continue;
    }
    const payload = {
      fecha: aFechaIso(Number(item.anio), Number(item.mes), Number(item.dia)),
      motivo: null,
      datos: {
        tipo: item.tipo,
        area: item.area,
        maquinaId: hojaId,
        anio: Number(item.anio),
        mes: Number(item.mes),
        dia: Number(item.dia),
      },
    };
    const { error } = await supabase.from("cronograma_excepciones").insert(payload);
    if (error) advertencias.push(`Excepcion ${item.tipo}: ${error.message}`);
    else importadas += 1;
  }

  for (const item of data.cronogramaPreventivo ?? []) {
    const hojaId = mapaHojas.get(item.maquinaId);
    if (!hojaId) continue;
    const { error } = await supabase.from("cronograma").insert({
      hoja_id: hojaId,
      fecha: aFechaIso(Number(item.anioBase), Number(item.mes), Number(item.dia)),
      datos: {
        origen: "manual_recurrente",
        area: item.area,
        anioBase: Number(item.anioBase),
        mes: Number(item.mes),
        dia: Number(item.dia),
        frecuenciaMeses: Number(item.frecuenciaMeses) || 12,
      },
    });
    if (error) advertencias.push(`Cronograma manual: ${error.message}`);
    else importadas += 1;
  }

  return importadas;
}

async function importarPreventivo(
  lista: PreventivoVanilla[],
  mapaHojas: Map<string, string>,
  advertencias: string[],
): Promise<number> {
  let importadas = 0;
  for (const registro of lista) {
    const hojaId = registro.maquinaId ? mapaHojas.get(registro.maquinaId) ?? null : null;
    let adjuntoUrl: string | null = null;
    if (registro.archivo?.startsWith("data:")) {
      try {
        adjuntoUrl = await subirDesdeDataUrl(
          registro.archivo,
          BUCKET_ADJUNTOS,
          "adjuntos",
          registro.archivoNombre || "preventivo",
        );
      } catch {
        advertencias.push(`Adjunto preventivo ${registro.fecha}: no se pudo subir.`);
      }
    } else if (registro.archivoEnIdb) {
      advertencias.push(
        `Preventivo ${registro.fecha}: el adjunto estaba en IndexedDB y no viene en el JSON.`,
      );
    }

    const { error } = await supabase.from("preventivo").insert({
      hoja_id: hojaId,
      area: registro.area || "",
      fecha: registro.fecha || new Date().toISOString().slice(0, 10),
      descripcion: (registro.descripcion || registro.actividad || "").trim(),
      adjunto_url: adjuntoUrl,
      datos: {
        equipo: registro.equipo || "",
        adjuntoNombre: registro.archivoNombre || "",
      },
    });
    if (error) advertencias.push(`Preventivo ${registro.fecha}: ${error.message}`);
    else importadas += 1;
  }
  return importadas;
}

async function importarCorrectivo(
  lista: CorrectivoVanilla[],
  mapaHojas: Map<string, string>,
  advertencias: string[],
): Promise<number> {
  let importadas = 0;
  for (const registro of lista) {
    const { error } = await supabase.from("correctivo").insert(mapearCorrectivo(registro, mapaHojas));
    if (error) advertencias.push(`Correctivo #${registro.numeroSolicitud}: ${error.message}`);
    else importadas += 1;
  }
  return importadas;
}

async function importarHorasProgramadas(
  mapa: Record<string, number> | undefined,
  advertencias: string[],
): Promise<number> {
  if (!mapa) return 0;
  let importadas = 0;
  for (const [clave, horas] of Object.entries(mapa)) {
    const [periodo, area] = clave.split(":");
    if (!periodo || !area || !Number.isFinite(horas) || horas <= 0) continue;
    const { error } = await supabase
      .from("horas_programadas")
      .upsert({ periodo, area, horas }, { onConflict: "periodo,area" });
    if (error) advertencias.push(`Horas ${clave}: ${error.message}`);
    else importadas += 1;
  }
  return importadas;
}

async function importarNoConformidades(
  lista: NoConformidadVanilla[],
  advertencias: string[],
): Promise<number> {
  let importadas = 0;
  for (const registro of lista) {
    const datos = mapearNc(registro);
    const { data, error } = await supabase
      .from("no_conformidades")
      .insert({ datos })
      .select()
      .single();
    if (error) {
      advertencias.push(`NC ${registro.numero ?? "?"}: ${error.message}`);
      continue;
    }
    try {
      const pdfBytes = await generarPdfGcRe009(datos, data.numero);
      const ruta = `${data.id}/${nombreArchivoPdf(data.numero)}`;
      const pdfUrl = await subirBytes(BUCKET_NC, ruta, pdfBytes, "application/pdf");
      await supabase.from("no_conformidades").update({ pdf_url: pdfUrl }).eq("id", data.id);
      importadas += 1;
    } catch (e) {
      advertencias.push(
        `NC ${data.numero}: guardada pero sin PDF (${e instanceof Error ? e.message : "error"}).`,
      );
      importadas += 1;
    }
  }
  return importadas;
}

export async function importarRespaldoV2(
  data: DatosRespaldoV2,
  opciones: OpcionesImportacion,
): Promise<ResultadoImportacion> {
  const advertencias: string[] = [];
  const mapaHojas = new Map<string, string>();

  if (opciones.vaciarAntes) {
    await vaciarDatosSupabase();
  }

  const hojas = await importarHojas(data.hojasDeVida ?? [], mapaHojas, advertencias);
  const excepciones = await importarExcepciones(data, mapaHojas, advertencias);
  const preventivo = await importarPreventivo(data.preventivo ?? [], mapaHojas, advertencias);
  const correctivo = await importarCorrectivo(data.correctivo ?? [], mapaHojas, advertencias);
  const horasProgramadas = await importarHorasProgramadas(
    data.indicadores?.horasProgramadas,
    advertencias,
  );
  const noConformidades = await importarNoConformidades(data.noConformidades ?? [], advertencias);

  return {
    conteo: {
      hojas,
      excepciones,
      preventivo,
      correctivo,
      horasProgramadas,
      noConformidades,
      cronogramaManual: data.cronogramaPreventivo?.length ?? 0,
    },
    advertencias,
  };
}
