// Aceita os nomes antigos (ANON / SERVICE_ROLE) e os novos (PUBLISHABLE / SECRET)
// que a integração Vercel ↔ Supabase pode criar.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_CHAVE_PUBLICA =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Só no servidor. Nunca usar em componente "use client".
export function chaveSecreta() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !chave) {
    throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.");
  }
  return { url: SUPABASE_URL, chave };
}

export function configPublica() {
  if (!SUPABASE_URL || !SUPABASE_CHAVE_PUBLICA) {
    throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente.");
  }
  return { url: SUPABASE_URL, chave: SUPABASE_CHAVE_PUBLICA };
}
