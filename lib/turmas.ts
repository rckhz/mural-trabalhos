import type { SupabaseClient } from "@supabase/supabase-js";

export type Turma = { id: string; serie: number; nome: string; ano_letivo: number };

export const rotuloTurma = (t: Pick<Turma, "serie" | "nome" | "ano_letivo">) =>
  `${t.serie}º ${t.nome} · ${t.ano_letivo}`;

// Turmas do ano mais recente primeiro; dentro do ano, por série e nome.
export async function buscarTurmas(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("turma")
    .select("id, serie, nome, ano_letivo")
    .order("ano_letivo", { ascending: false })
    .order("serie")
    .order("nome")
    .returns<Turma[]>();
  return data ?? [];
}
