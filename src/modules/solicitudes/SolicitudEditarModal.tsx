import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  actualizarCorrectivo,
  eliminarCorrectivo,
} from "../correctivo/correctivoService";
import type { RegistroCorrectivo } from "../correctivo/types";
import {
  detenerCronometroAlCerrar,
  marcarEsperaYPausarCronometro,
  quitarEsperaYReanudarCronometro,
} from "./cronometroAcciones";
import "./solicitudes.css";

interface Props {
  registro: RegistroCorrectivo;
  puedeEliminar: boolean;
  onCerrar: () => void;
  onActualizado: (registro: RegistroCorrectivo) => void;
  onEliminado: (id: string) => void;
}

function SolicitudEditarModal({
  registro,
  puedeEliminar,
  onCerrar,
  onActualizado,
  onEliminado,
}: Props) {
  const cerrada = Boolean(registro.datos.fechaCierre?.trim());
  const [descripcion, setDescripcion] = useState(registro.datos.descripcionSolicitud ?? "");
  const [solucion, setSolucion] = useState(registro.datos.solucionSolicitud ?? "");
  const [fechaCierre, setFechaCierre] = useState(registro.datos.fechaCierre?.slice(0, 10) ?? "");
  const [horaCierre, setHoraCierre] = useState(registro.datos.horaCierre?.slice(0, 5) ?? "");
  const [esperaRepuesto, setEsperaRepuesto] = useState(Boolean(registro.datos.esperaRepuesto));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function alTecla(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [onCerrar]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      let actualizado = registro;
      const cierraAhora = Boolean(fechaCierre.trim()) && !cerrada;

      if (esperaRepuesto !== Boolean(registro.datos.esperaRepuesto) && !fechaCierre) {
        actualizado = esperaRepuesto
          ? await marcarEsperaYPausarCronometro(registro.id)
          : await quitarEsperaYReanudarCronometro(registro.id);
      }

      const datos = {
        ...actualizado.datos,
        descripcionSolicitud: descripcion.trim(),
        solucionSolicitud: solucion.trim(),
        fechaCierre: fechaCierre.trim(),
        horaCierre: horaCierre.trim(),
        esperaRepuesto: fechaCierre.trim() ? false : esperaRepuesto,
      };

      actualizado = await actualizarCorrectivo(registro.id, {
        area: registro.area,
        fecha: registro.fecha,
        personal_id: registro.personal_id,
        datos,
      });

      if (cierraAhora) {
        actualizado = await detenerCronometroAlCerrar(registro.id);
      }

      onActualizado(actualizado);
      onCerrar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (
      !window.confirm(
        `¿Eliminar la solicitud #${registro.datos.numeroSolicitud}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await eliminarCorrectivo(registro.id);
      onEliminado(registro.id);
      onCerrar();
    } catch (err) {
      setError((err as Error).message);
      setGuardando(false);
    }
  }

  return (
    <div className="sol-modal__overlay" onClick={onCerrar} role="presentation">
      <div
        className="sol-modal sol-modal--editar"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sol-editar-titulo"
      >
        <header className="sol-modal__cabecera">
          <div>
            <h2 id="sol-editar-titulo">Solicitud #{registro.datos.numeroSolicitud}</h2>
            <p className="sol-modal__sub">
              {registro.area} · {registro.datos.maquinaEquipoLocacion || "Sin máquina"}
            </p>
          </div>
          <button type="button" className="sol-modal__cerrar" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </header>

        <form className="sol-modal__form" onSubmit={(e) => void guardar(e)}>
          <label>
            Descripción del problema
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            />
          </label>
          <label>
            Solución / trabajo realizado
            <textarea
              rows={3}
              value={solucion}
              onChange={(e) => setSolucion(e.target.value)}
              placeholder="Opcional hasta cerrar la solicitud"
            />
          </label>

          <div className="sol-modal__fila">
            <label>
              Fecha cierre
              <input
                type="date"
                value={fechaCierre}
                onChange={(e) => setFechaCierre(e.target.value)}
              />
            </label>
            <label>
              Hora cierre
              <input
                type="time"
                value={horaCierre}
                onChange={(e) => setHoraCierre(e.target.value)}
              />
            </label>
          </div>

          {!fechaCierre && (
            <label className="check-tipo">
              <input
                type="checkbox"
                checked={esperaRepuesto}
                onChange={(e) => setEsperaRepuesto(e.target.checked)}
              />{" "}
              En espera de repuesto (pausa el cronómetro)
            </label>
          )}

          {error && <p className="solicitudes__error">{error}</p>}

          <footer className="sol-modal__pie">
            {puedeEliminar && (
              <button
                type="button"
                className="btn btn--peligro"
                disabled={guardando}
                onClick={() => void eliminar()}
              >
                Eliminar
              </button>
            )}
            <div className="sol-modal__pie-derecha">
              <Link
                to="/correctivo"
                state={{ editarCorrectivoId: registro.id, filtroArea: registro.area }}
                className="btn"
              >
                Formulario completo
              </Link>
              <button type="button" className="btn" disabled={guardando} onClick={onCerrar}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primario" disabled={guardando}>
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default SolicitudEditarModal;
