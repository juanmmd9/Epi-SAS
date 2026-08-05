import { useEffect, useState, type FormEvent } from "react";
import { AREAS_SISTEMA, coincideArea } from "../../lib/areas";
import type { HojaVida, HojaVidaInput } from "./types";

interface Props {
  hojaEnEdicion: HojaVida | null;
  guardando: boolean;
  onGuardar: (input: HojaVidaInput, foto: File | null) => void;
  onCancelarEdicion: () => void;
}

const formularioVacio = {
  nombre: "",
  codigo: "",
  area: "",
  marca: "",
  modelo: "",
  serial: "",
  peso: "",
  medidas: "",
  ubicacion: "",
  frecuencia: "12",
  primerPm: "",
};

function HojaForm({ hojaEnEdicion, guardando, onGuardar, onCancelarEdicion }: Props) {
  const [campos, setCampos] = useState(formularioVacio);
  const [foto, setFoto] = useState<File | null>(null);
  const esMoldes = coincideArea(campos.area, "Moldes");

  useEffect(() => {
    if (hojaEnEdicion) {
      setCampos({
        nombre: hojaEnEdicion.nombre,
        codigo: hojaEnEdicion.codigo ?? "",
        area: hojaEnEdicion.area,
        marca: hojaEnEdicion.datos.marca ?? "",
        modelo: hojaEnEdicion.datos.modelo ?? "",
        serial: hojaEnEdicion.datos.serial ?? "",
        peso: hojaEnEdicion.datos.peso ?? "",
        medidas: hojaEnEdicion.datos.medidas ?? "",
        ubicacion: hojaEnEdicion.datos.ubicacion ?? "",
        frecuencia: String(hojaEnEdicion.frecuencia_pm_meses ?? 12),
        primerPm: hojaEnEdicion.primer_pm ?? "",
      });
    } else {
      setCampos(formularioVacio);
    }
    setFoto(null);
  }, [hojaEnEdicion]);

  function actualizarCampo(nombre: keyof typeof formularioVacio, valor: string) {
    setCampos((previos) => ({ ...previos, [nombre]: valor }));
  }

  function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    const areaMoldes = coincideArea(campos.area, "Moldes");
    onGuardar(
      {
        nombre: campos.nombre.trim(),
        codigo: campos.codigo.trim(),
        area: campos.area,
        frecuencia_pm_meses: Math.max(1, Number.parseInt(campos.frecuencia, 10) || 12),
        primer_pm: campos.primerPm || null,
        datos: {
          marca: campos.marca.trim(),
          ubicacion: campos.ubicacion.trim(),
          ...(areaMoldes
            ? {
                peso: campos.peso.trim(),
                medidas: campos.medidas.trim(),
              }
            : {
                modelo: campos.modelo.trim(),
                serial: campos.serial.trim(),
              }),
          ...(hojaEnEdicion?.datos.fechaBaja
            ? { fechaBaja: hojaEnEdicion.datos.fechaBaja }
            : {}),
          ...(hojaEnEdicion?.datos.motivoBaja
            ? { motivoBaja: hojaEnEdicion.datos.motivoBaja }
            : {}),
        },
      },
      foto,
    );
  }

  return (
    <form className="hoja-form" onSubmit={manejarEnvio}>
      <h2>{hojaEnEdicion ? "Editar máquina" : "Registrar máquina"}</h2>

      <div className="hoja-form__grid">
        <label>
          Nombre *
          <input
            required
            value={campos.nombre}
            onChange={(e) => actualizarCampo("nombre", e.target.value)}
            placeholder={esMoldes ? "Ej. Molde tapa 500 ml" : "Ej. Compresor principal"}
          />
        </label>

        <label>
          Código *
          <input
            required
            value={campos.codigo}
            onChange={(e) => actualizarCampo("codigo", e.target.value)}
            placeholder={esMoldes ? "Ej. MOL-001" : "Ej. COM-001"}
          />
        </label>

        <label>
          Área *
          <select
            required
            value={campos.area}
            onChange={(e) => actualizarCampo("area", e.target.value)}
          >
            <option value="">Selecciona un área</option>
            {AREAS_SISTEMA.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>

        <label>
          Marca
          <input
            value={campos.marca}
            onChange={(e) => actualizarCampo("marca", e.target.value)}
          />
        </label>

        {esMoldes ? (
          <>
            <label>
              Peso del molde
              <input
                value={campos.peso}
                onChange={(e) => actualizarCampo("peso", e.target.value)}
                placeholder="Ej. 85 kg"
              />
            </label>

            <label>
              Medidas del molde
              <input
                value={campos.medidas}
                onChange={(e) => actualizarCampo("medidas", e.target.value)}
                placeholder="Ej. 400 x 300 x 250 mm"
              />
            </label>
          </>
        ) : (
          <>
            <label>
              Modelo
              <input
                value={campos.modelo}
                onChange={(e) => actualizarCampo("modelo", e.target.value)}
              />
            </label>

            <label>
              Serial
              <input
                value={campos.serial}
                onChange={(e) => actualizarCampo("serial", e.target.value)}
              />
            </label>
          </>
        )}

        <label>
          Ubicación
          <input
            value={campos.ubicacion}
            onChange={(e) => actualizarCampo("ubicacion", e.target.value)}
          />
        </label>

        <label>
          Frecuencia PM (meses) *
          <input
            required
            type="number"
            min={1}
            value={campos.frecuencia}
            onChange={(e) => actualizarCampo("frecuencia", e.target.value)}
          />
        </label>

        <label>
          Primer PM
          <input
            type="date"
            value={campos.primerPm}
            onChange={(e) => actualizarCampo("primerPm", e.target.value)}
          />
        </label>

        <label>
          Foto de la máquina
          {hojaEnEdicion?.foto_url && !foto && (
            <span className="hoja-form__foto-actual">
              <img src={hojaEnEdicion.foto_url} alt={hojaEnEdicion.nombre} />
              <small>Foto actual. Elige un archivo para reemplazarla.</small>
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <div className="hoja-form__acciones">
        <button type="submit" className="btn btn--primario" disabled={guardando}>
          {guardando
            ? "Guardando..."
            : hojaEnEdicion
              ? "Guardar cambios"
              : "Registrar máquina"}
        </button>
        {hojaEnEdicion && (
          <button type="button" className="btn" onClick={onCancelarEdicion}>
            Cancelar edición
          </button>
        )}
      </div>
    </form>
  );
}

export default HojaForm;
