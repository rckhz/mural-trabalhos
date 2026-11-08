import { createBrowserClient } from "@supabase/ssr";

// Cliente do navegador (usa a sessão dos cookies). Serve para enviar arquivos
// direto ao Storage, sem passar pelo servidor da Vercel (limite de ~4,5 MB).
export function supabaseNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
  );
}
