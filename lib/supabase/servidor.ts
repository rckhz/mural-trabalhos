import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { configPublica } from "@/lib/supabase/config";

// Cliente para Server Components: usa a sessão do usuário (se houver) pelos cookies,
// então o RLS decide o que cada um vê.
export async function supabaseServidor() {
  const cookieStore = await cookies();
  const { url, chave } = configPublica();
  return createServerClient(
    url,
    chave,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (lista) => {
          try {
            lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components não podem gravar cookies; a renovação fica para o proxy.
          }
        },
      },
    },
  );
}
