export type EstadoSeguimiento = "al_dia" | "pendiente" | "atencion";

export interface NotaEquipo {
  id: string;
  fecha: string;
  estado: EstadoSeguimiento;
  texto: string;
}

export interface PersonaEquipo {
  id: string;
  nombre: string;
  cargo: string;
  notas: NotaEquipo[];
}

function clave(usuarioId: string): string {
  return `epi-equipo-diseno:${usuarioId}`;
}

function idNuevo(): string {
  return crypto.randomUUID();
}

export function etiquetaEstadoEquipo(estado: EstadoSeguimiento): string {
  if (estado === "al_dia") return "Al día";
  if (estado === "pendiente") return "Pendiente";
  return "Requiere atención";
}

export function leerEquipo(usuarioId: string): PersonaEquipo[] {
  try {
    const raw = localStorage.getItem(clave(usuarioId));
    if (!raw) return [];
    const data = JSON.parse(raw) as PersonaEquipo[];
    if (!Array.isArray(data)) return [];
    return data
      .filter((persona) => persona && typeof persona.id === "string" && typeof persona.nombre === "string")
      .map((persona) => ({
        id: persona.id,
        nombre: persona.nombre,
        cargo: typeof persona.cargo === "string" ? persona.cargo : "",
        notas: Array.isArray(persona.notas) ? persona.notas : [],
      }));
  } catch {
    return [];
  }
}

function guardarEquipo(usuarioId: string, personas: PersonaEquipo[]) {
  localStorage.setItem(clave(usuarioId), JSON.stringify(personas));
}

export function agregarPersona(
  usuarioId: string,
  nombre: string,
  cargo: string,
): PersonaEquipo[] {
  const personas = leerEquipo(usuarioId);
  personas.push({
    id: idNuevo(),
    nombre: nombre.trim(),
    cargo: cargo.trim(),
    notas: [],
  });
  personas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  guardarEquipo(usuarioId, personas);
  return personas;
}

export function actualizarPersona(
  usuarioId: string,
  personaId: string,
  nombre: string,
  cargo: string,
): PersonaEquipo[] {
  const personas = leerEquipo(usuarioId).map((persona) =>
    persona.id === personaId
      ? { ...persona, nombre: nombre.trim(), cargo: cargo.trim() }
      : persona,
  );
  personas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  guardarEquipo(usuarioId, personas);
  return personas;
}

export function quitarPersona(usuarioId: string, personaId: string): PersonaEquipo[] {
  const personas = leerEquipo(usuarioId).filter((persona) => persona.id !== personaId);
  guardarEquipo(usuarioId, personas);
  return personas;
}

export function agregarNota(
  usuarioId: string,
  personaId: string,
  nota: Omit<NotaEquipo, "id">,
): PersonaEquipo[] {
  const personas = leerEquipo(usuarioId).map((persona) => {
    if (persona.id !== personaId) return persona;
    return {
      ...persona,
      notas: [{ ...nota, id: idNuevo(), texto: nota.texto.trim() }, ...persona.notas],
    };
  });
  guardarEquipo(usuarioId, personas);
  return personas;
}

export function quitarNota(
  usuarioId: string,
  personaId: string,
  notaId: string,
): PersonaEquipo[] {
  const personas = leerEquipo(usuarioId).map((persona) => {
    if (persona.id !== personaId) return persona;
    return { ...persona, notas: persona.notas.filter((nota) => nota.id !== notaId) };
  });
  guardarEquipo(usuarioId, personas);
  return personas;
}

export function ultimaNota(persona: PersonaEquipo): NotaEquipo | null {
  return persona.notas[0] ?? null;
}
