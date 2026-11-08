"use server";

import { revalidatePath } from "next/cache";
import { sessaoAtual } from "@/lib/sessao";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Apaga os "arquivos soltos": arquivos no Storage que nenhum projeto usa mais
// (sobras de envios antigos). Arquivos com menos de 1 hora nunca entram na lista.
export async function limparSoltos(): Promise<{ erro?: string; apagados?: number }> {
  const s = await sessaoAtual();
  if (s?.perfil.funcao !== "professora") return { erro: "Acesso negado." };

  const { data, error } = await s.supabase.rpc("arquivos_soltos");
  if (error) return { erro: "Não foi possível listar os arquivos." };
  const lista = (data ?? []) as { bucket: string; nome: string }[];

  const admin = supabaseAdmin();
  let apagados = 0;
  for (const bucket of ["documentos", "fotos"]) {
    const nomes = lista.filter((a) => a.bucket === bucket).map((a) => a.nome);
    for (let i = 0; i < nomes.length; i += 100) {
      const { data: removidos } = await admin.storage.from(bucket).remove(nomes.slice(i, i + 100));
      apagados += removidos?.length ?? 0;
    }
  }
  revalidatePath("/painel");
  return { apagados };
}
