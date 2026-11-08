import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { chaveSecreta } from "@/lib/supabase/config";

let cliente: SupabaseClient | undefined;

// Ignora o RLS. Usar SÓ no servidor, depois de conferir que quem chama é professora.
export function supabaseAdmin() {
  if (cliente) return cliente;
  const { url, chave } = chaveSecreta();
  return (cliente = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));
}
