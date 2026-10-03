import sqlMigracion from "../../../supabase/migrations/hojas_vida_fotos_storage.sql?raw";

export const SQL_MIGRACION_FOTOS_HOJAS = sqlMigracion;

export function esErrorFotosHojas(mensaje: string): boolean {
  return /bucket|storage|row-level security|RLS|policy|permission|not found|violates/i.test(
    mensaje,
  );
}
