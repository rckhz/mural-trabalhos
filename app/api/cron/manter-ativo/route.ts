import { createClient } from "@supabase/supabase-js";
import { configPublica } from "@/lib/supabase/config";

// Chamado 1x por dia pelo Vercel Cron (vercel.json) para o Supabase Free
// não pausar o projeto por inatividade nas férias.
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Não autorizado", { status: 401 });
  }
  const { url, chave } = configPublica();
  const supabase = createClient(url, chave);
  const { error } = await supabase.from("turma").select("id").limit(1);
  return Response.json({ ok: !error }, { status: error ? 500 : 200 });
}
