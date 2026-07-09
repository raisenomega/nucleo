import { createClient } from "@supabase/supabase-js";

// Sesión persistente con refresh automático en background: el usuario no ve logout mientras
// use la app. El límite dormant (30 días de inactividad) se configura en Auth del proyecto.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: true, persistSession: true } },
);
