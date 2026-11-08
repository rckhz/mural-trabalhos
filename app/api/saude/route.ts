import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CHAVE_PUBLICA, SUPABASE_URL } from "@/lib/supabase/config";

// Diagnóstico: diz SE cada variável existe (nunca o valor) e se o banco responde.
export const dynamic = "force-dynamic";

export async function GET() {
  const variaveis = Object.fromEntries(
    [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SECRET_KEY",
      "CRON_SECRET",
    ].map((n) => [n, Boolean(process.env[n])]),
  );

  let banco = "sem configuração";
  if (SUPABASE_URL && SUPABASE_CHAVE_PUBLICA) {
    const { data, error } = await createClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICA)
      .from("turma")
      .select("id");
    banco = error ? `erro: ${error.message}` : `ok (${data.length} turmas)`;
  }

  return Response.json({ variaveis, banco });
}
