import type {
  RealtimeChannel,
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { supabase } from "../services/supabase";

type EventoPostgres = "*" | "INSERT" | "UPDATE" | "DELETE";

type Binding = {
  filter: {
    event: EventoPostgres;
    schema: string;
    table: string;
    filter?: string;
  };
  handler: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
};

/**
 * Crea un canal realtime con todos los callbacks ANTES de subscribe().
 * Si ya existía un canal con el mismo nombre (remount Strict Mode / mismo ms),
 * lo quita primero para evitar: "cannot add postgres_changes callbacks after subscribe()".
 */
export function suscribirPostgresChanges(
  nombreCanal: string,
  bindings: Binding[],
  onStatus?: (status: string) => void,
): RealtimeChannel | null {
  try {
    const topic = `realtime:${nombreCanal}`;
    for (const ch of supabase.getChannels()) {
      if (ch.topic === topic || ch.topic === nombreCanal) {
        void supabase.removeChannel(ch);
      }
    }

    let canal = supabase.channel(nombreCanal);
    for (const b of bindings) {
      canal = canal.on(
        "postgres_changes",
        b.filter as RealtimePostgresChangesFilter<EventoPostgres>,
        b.handler,
      );
    }
    if (onStatus) {
      canal.subscribe((status) => onStatus(status));
    } else {
      canal.subscribe();
    }
    return canal;
  } catch (e) {
    console.warn(`[realtime] No se pudo suscribir ${nombreCanal}:`, e);
    return null;
  }
}

export function quitarCanalRealtime(canal: RealtimeChannel | null | undefined): void {
  if (!canal) return;
  void supabase.removeChannel(canal);
}
