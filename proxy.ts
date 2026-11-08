import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_CHAVE_PUBLICA, SUPABASE_URL } from "@/lib/supabase/config";

// Renova a sessão do Supabase a cada navegação (Next 16: "proxy" substitui o antigo middleware).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Sem configuração não derruba o site inteiro: a página inicial continua abrindo
  // e as páginas que usam o Supabase mostram o erro claro nos logs.
  if (!SUPABASE_URL || !SUPABASE_CHAVE_PUBLICA) return response;

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_CHAVE_PUBLICA,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
