import { useRef, useState } from "react";
import { contarRespaldo, parseRespaldoJson, respaldoTieneDatos } from "./respaldoParser";
import { importarRespaldoV2 } from "./importadorService";
import type { ConteoRespaldo } from "./types";
import "./importador.css";

interface Props {
  onImportado?: () => void;
}

function resumenConteo(conteo: ConteoRespaldo): string {
  return [
    `${conteo.hojas} hoja(s)`,
    `${conteo.preventivo} preventivo(s)`,
    `${conteo.correctivo} correctivo(s)`,
    `${conteo.excepciones} excepcion(es)`,
    `${conteo.noConformidades} NC(s)`,
    `${conteo.horasProgramadas} hora(s) prog.`,
  ].join(", ");
}

function ImportadorRespaldo({ onImportado }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [vaciarAntes, setVaciarAntes] = useState(false);
  const [importando, setImportando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function manejarArchivo(archivo: File) {
    setImportando(true);
    setMensaje("Leyendo respaldo...");
    setError(null);

    try {
      const respaldo = parseRespaldoJson(await archivo.text());
      if (!respaldoTieneDatos(respaldo.data)) {
        throw new Error("El archivo esta vacio o no es un respaldo valido de este portal.");
      }

      const previo = contarRespaldo(respaldo.data);
      setMensaje(
        `Importando ${previo.hojas} hoja(s), ${previo.preventivo} preventivo(s), ${previo.correctivo} correctivo(s)...`,
      );

      const resultado = await importarRespaldoV2(respaldo.data, { vaciarAntes });
      const texto = `Importacion completada: ${resumenConteo(resultado.conteo)}.`;
      setMensaje(
        resultado.advertencias.length > 0
          ? `${texto} ${resultado.advertencias.length} advertencia(s).`
          : texto,
      );
      if (resultado.advertencias.length > 0) {
        console.warn("Importacion con advertencias:", resultado.advertencias);
      }
      onImportado?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo importar el respaldo.");
      setMensaje(null);
    } finally {
      setImportando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="importador">
      <h2>Respaldo de datos</h2>
      <p className="importador__descripcion">
        Sube un archivo <strong>respaldo-general-*.json</strong> exportado desde la version
        anterior del portal (localStorage) para cargarlo en Supabase.
      </p>
      <div className="importador__acciones">
        <button
          type="button"
          className="btn btn--primario"
          disabled={importando}
          onClick={() => inputRef.current?.click()}
        >
          {importando ? "Importando..." : "Importar respaldo JSON v2"}
        </button>
        <label className="importador__opcion">
          <input
            type="checkbox"
            checked={vaciarAntes}
            onChange={(e) => setVaciarAntes(e.target.checked)}
            disabled={importando}
          />
          Vaciar datos actuales antes de importar
        </label>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) void manejarArchivo(archivo);
        }}
      />
      {mensaje && <p className="importador__mensaje importador__mensaje--ok">{mensaje}</p>}
      {error && <p className="importador__mensaje importador__mensaje--error">{error}</p>}
    </section>
  );
}

export default ImportadorRespaldo;
