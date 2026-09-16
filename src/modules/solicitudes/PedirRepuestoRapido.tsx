import { useState, type FormEvent } from "react";
import { marcarEsperaYPausarCronometro } from "./cronometroAcciones";
import { crearRepuesto } from "./repuestosService";
import type { EstadoRepuesto } from "./types";
import type { RegistroCorrectivo } from "../correctivo/types";
import "./solicitudes.css";

interface Props {
  area: string;
  correctivoId: string;
  hojaId?: string | null;
  disabled?: boolean;
  etiquetaBoton?: string;
  /** Control externo del panel (p. ej. botón «Repuestos» en la tarjeta). */
  abierto?: boolean;
  onAbrirChange?: (abierto: boolean) => void;
  mostrarBoton?: boolean;
  onCreado: (actualizado: RegistroCorrectivo) => void;
}

/**
 * Formulario corto para pedir un repuesto ligado a la solicitud.
 * Al crear, pausa el cronómetro en la base de datos.
 */
function PedirRepuestoRapido({
  area,
  correctivoId,
  hojaId,
  disabled,
  etiquetaBoton = "Repuestos",
  abierto: abiertoProp,
  onAbrirChange,
  mostrarBoton = true,
  onCreado,
}: Props) {
  const [abiertoLocal, setAbiertoLocal] = useState(false);
  const abierto = abiertoProp ?? abiertoLocal;

  function setAbierto(valor: boolean) {
    if (abiertoProp === undefined) setAbiertoLocal(valor);
    onAbrirChange?.(valor);
  }
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [notas, setNotas] = useState("");

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const desc = descripcion.trim();
    if (!desc) {
      setError("Describe el repuesto que necesitas.");
      return;
    }
    const cant = Number.parseFloat(cantidad);
    if (!Number.isFinite(cant) || cant <= 0) {
      setError("Cantidad inválida.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await crearRepuesto({
        area,
        correctivo_id: correctivoId,
        hoja_id: hojaId || null,
        codigo: codigo.trim(),
        descripcion: desc,
        cantidad: cant,
        estado: "solicitado" as EstadoRepuesto,
        notas: notas.trim(),
      });
      // Pausar siempre desde BD (no depende del estado local del formulario).
      const actualizado = await marcarEsperaYPausarCronometro(correctivoId);
      setDescripcion("");
      setCodigo("");
      setCantidad("1");
      setNotas("");
      setAbierto(false);
      onCreado(actualizado);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) {
    if (!mostrarBoton) return null;
    return (
      <button
        type="button"
        className="btn btn--repuesto"
        disabled={disabled}
        onClick={() => setAbierto(true)}
      >
        {etiquetaBoton}
      </button>
    );
  }

  return (
    <form className="pedir-repuesto" onSubmit={enviar}>
      <h3>Pedir repuesto</h3>
      <p className="pedir-repuesto__hint">
        Al guardar se marca en espera y se pausa el cronómetro hasta que llegue el repuesto.
      </p>
      <label>
        Descripción *
        <input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej. Rodamiento 6205, sello hidráulico…"
          required
          autoFocus
        />
      </label>
      <div className="pedir-repuesto__fila">
        <label>
          Código / ref.
          <input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
        </label>
        <label>
          Cantidad *
          <input
            type="number"
            min="0.01"
            step="any"
            required
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
        </label>
      </div>
      <label>
        Notas
        <input
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Urgente, proveedor, etc."
        />
      </label>
      {error && <p className="pedir-repuesto__error">{error}</p>}
      <div className="pedir-repuesto__acciones">
        <button type="submit" className="btn btn--primario" disabled={guardando}>
          {guardando ? "Guardando…" : "Solicitar y pausar tiempo"}
        </button>
        <button
          type="button"
          className="btn"
          disabled={guardando}
          onClick={() => setAbierto(false)}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default PedirRepuestoRapido;
