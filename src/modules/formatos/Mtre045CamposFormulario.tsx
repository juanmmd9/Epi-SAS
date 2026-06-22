import type { Mtre045Datos, VerificacionAn } from "./mtre045Types";

/** Campos del formato que el operador llena en el registro PM. */
export type CamposFormatoMtre045 = Pick<
  Mtre045Datos,
  | "cambioRepuestos"
  | "verificacionEquipoPm"
  | "actividadCorrectivo"
  | "cambioRepuestosCorrectivo"
  | "verificacionCorrectivo"
  | "inspeccionVisual"
  | "pruebasFuncionamiento"
  | "noAprobo"
  | "responsableVerificacion"
>;

export function camposFormatoMtre045Vacios(): CamposFormatoMtre045 {
  return {
    cambioRepuestos: "",
    verificacionEquipoPm: "",
    actividadCorrectivo: "",
    cambioRepuestosCorrectivo: "",
    verificacionCorrectivo: "",
    inspeccionVisual: "",
    pruebasFuncionamiento: "",
    noAprobo: "",
    responsableVerificacion: "",
  };
}

export function extraerCamposFormato(mtre?: Mtre045Datos): CamposFormatoMtre045 {
  if (!mtre) return camposFormatoMtre045Vacios();
  return {
    cambioRepuestos: mtre.cambioRepuestos ?? "",
    verificacionEquipoPm: mtre.verificacionEquipoPm ?? "",
    actividadCorrectivo: mtre.actividadCorrectivo ?? "",
    cambioRepuestosCorrectivo: mtre.cambioRepuestosCorrectivo ?? "",
    verificacionCorrectivo: mtre.verificacionCorrectivo ?? "",
    inspeccionVisual: mtre.inspeccionVisual ?? "",
    pruebasFuncionamiento: mtre.pruebasFuncionamiento ?? "",
    noAprobo: mtre.noAprobo ?? "",
    responsableVerificacion: mtre.responsableVerificacion ?? "",
  };
}

interface Props {
  datos: CamposFormatoMtre045;
  onChange: (cambios: Partial<CamposFormatoMtre045>) => void;
}

/** Bloque de campos MT-RE-045 (repuestos, verificación, correctivo). */
function Mtre045CamposFormulario({ datos, onChange }: Props) {
  return (
    <fieldset className="mtre045-campos-form">
      <legend>Reporte MT-RE-045 (mismo contenido del formato impreso)</legend>

      <div className="mtre045-campos-form__grid">
        <label className="mtre045-campos-form__ancho">
          Cambio de repuestos o insumos (PM) — una línea por ítem (1 a 8)
          <textarea
            rows={4}
            value={datos.cambioRepuestos}
            onChange={(e) => onChange({ cambioRepuestos: e.target.value })}
            placeholder={"Aceite hidráulico\nFiltro de aire\n..."}
          />
        </label>

        <label className="mtre045-campos-form__ancho">
          Verificación del equipo (PM)
          <textarea
            rows={2}
            value={datos.verificacionEquipoPm}
            onChange={(e) => onChange({ verificacionEquipoPm: e.target.value })}
            placeholder="Estado del equipo tras el mantenimiento..."
          />
        </label>

        <label className="mtre045-campos-form__ancho">
          Actividad correctivo (si aplica)
          <textarea
            rows={2}
            value={datos.actividadCorrectivo}
            onChange={(e) => onChange({ actividadCorrectivo: e.target.value })}
          />
        </label>

        <label className="mtre045-campos-form__ancho">
          Cambio repuestos (correctivo) — una línea por ítem
          <textarea
            rows={3}
            value={datos.cambioRepuestosCorrectivo}
            onChange={(e) => onChange({ cambioRepuestosCorrectivo: e.target.value })}
          />
        </label>

        <label className="mtre045-campos-form__ancho">
          Verificación del equipo (correctivo)
          <textarea
            rows={2}
            value={datos.verificacionCorrectivo}
            onChange={(e) => onChange({ verificacionCorrectivo: e.target.value })}
          />
        </label>

        <label>
          Inspección visual
          <select
            value={datos.inspeccionVisual}
            onChange={(e) =>
              onChange({ inspeccionVisual: e.target.value as VerificacionAn })
            }
          >
            <option value="">—</option>
            <option value="A">A — Aprobado</option>
            <option value="NA">NA — No aprobado</option>
          </select>
        </label>

        <label>
          Pruebas de funcionamiento
          <select
            value={datos.pruebasFuncionamiento}
            onChange={(e) =>
              onChange({ pruebasFuncionamiento: e.target.value as VerificacionAn })
            }
          >
            <option value="">—</option>
            <option value="A">A — Aprobado</option>
            <option value="NA">NA — No aprobado</option>
          </select>
        </label>

        <label className="mtre045-campos-form__ancho">
          No aprobó (detalle)
          <input
            value={datos.noAprobo}
            onChange={(e) => onChange({ noAprobo: e.target.value })}
          />
        </label>

        <label>
          Responsable de verificación
          <input
            value={datos.responsableVerificacion}
            onChange={(e) => onChange({ responsableVerificacion: e.target.value })}
            placeholder="Nombre de quien verifica"
          />
        </label>
      </div>
    </fieldset>
  );
}

export default Mtre045CamposFormulario;
