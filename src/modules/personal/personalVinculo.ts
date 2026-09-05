import type { RegistroCorrectivo } from "../correctivo/types";
import type { RegistroPreventivo } from "../preventivo/types";
import type { Persona } from "./types";

export interface DatosPersonalVinculo {
  personalIds: string[];
  personalNombres: string[];
  personalId?: string;
  personalNombre?: string;
}

function idsUnicos(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

export function idsPersonalDePreventivo(registro: RegistroPreventivo): string[] {
  const varios = registro.datos.personalIds;
  if (Array.isArray(varios) && varios.length > 0) return idsUnicos(varios);
  const uno = registro.personal_id ?? registro.datos.personalId;
  return uno ? [uno] : [];
}

export function idsPersonalDeCorrectivo(registro: RegistroCorrectivo): string[] {
  const varios = registro.datos.personalIds;
  if (Array.isArray(varios) && varios.length > 0) return idsUnicos(varios);
  const uno = registro.personal_id ?? registro.datos.personalId;
  return uno ? [uno] : [];
}

export function construirDatosPersonal(
  ids: string[],
  personal: Persona[],
): DatosPersonalVinculo {
  const idsValidos = idsUnicos(ids);
  const nombres = idsValidos.map(
    (id) => personal.find((p) => p.id === id)?.nombre ?? "Técnico eliminado",
  );
  return {
    personalIds: idsValidos,
    personalNombres: nombres,
    personalId: idsValidos[0],
    personalNombre: nombres[0],
  };
}

export function nombresPersonalEnRegistro(
  ids: string[],
  personal: Persona[],
  nombresGuardados?: string[],
): string {
  if (ids.length === 0) return "—";
  const textos = ids.map((id, indice) => {
    const persona = personal.find((p) => p.id === id);
    if (persona) return persona.nombre;
    return nombresGuardados?.[indice] ?? "Técnico eliminado";
  });
  return textos.join(", ");
}

export function idsDesdeRegistroPreventivo(registro: RegistroPreventivo): string[] {
  return idsPersonalDePreventivo(registro);
}

export function idsDesdeRegistroCorrectivo(registro: RegistroCorrectivo): string[] {
  return idsPersonalDeCorrectivo(registro);
}
