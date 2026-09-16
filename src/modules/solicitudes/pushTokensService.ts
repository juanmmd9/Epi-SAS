import { supabase } from "../../services/supabase";

export interface PushTokenRow {
  id: string;
  user_id: string;
  token: string;
  plataforma: string;
  activo: boolean;
}

export async function guardarPushToken(
  userId: string,
  token: string,
  plataforma = "android",
): Promise<void> {
  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: userId,
      token,
      plataforma,
      activo: true,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "token" },
  );
  if (error) throw new Error(error.message);
}

export async function desactivarPushToken(token: string): Promise<void> {
  const { error } = await supabase
    .from("push_tokens")
    .update({ activo: false, actualizado_en: new Date().toISOString() })
    .eq("token", token);
  if (error) throw new Error(error.message);
}
