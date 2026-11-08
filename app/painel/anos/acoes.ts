"use server";

import { revalidatePath } from "next/cache";
import { sessaoAtual } from "@/lib/sessao";

async function professora() {
  const s = await sessaoAtual();
  if (s?.perfil.funcao !== "professora") throw new Error("Acesso negado");
  return s;
}

function revalidar() {
  revalidatePath("/painel", "layout");
  revalidatePath("/mural");
}

// Cria o ano letivo já com as 6 turmas (1º, 2º e 3º; MIL e MIN).
export async function criarAno(_: string | null, form: FormData): Promise<string | null> {
  const { supabase } = await professora();
  const ano = Number(form.get("ano"));
  if (!Number.isInteger(ano) || ano < 2020 || ano > 2100) return "Digite um ano entre 2020 e 2100.";

  const { error } = await supabase.from("ano_letivo").insert({ ano });
  if (error) return error.code === "23505" ? `O ano ${ano} já existe.` : "Não foi possível criar o ano.";

  const turmas = [1, 2, 3].flatMap((serie) => ["MIL", "MIN"].map((nome) => ({ ano_letivo: ano, serie, nome })));
  const { error: erroTurmas } = await supabase.from("turma").insert(turmas);
  if (erroTurmas) {
    await supabase.from("ano_letivo").delete().eq("ano", ano); // não deixa ano pela metade
    return "Não foi possível criar as turmas do ano.";
  }
  revalidar();
  return null;
}

// Remove o ano (e as 6 turmas) só se estiver vazio: sem projetos e sem contas.
export async function removerAno(ano: number): Promise<{ erro?: string }> {
  const { supabase } = await professora();
  const { data: turmas } = await supabase.from("turma").select("id").eq("ano_letivo", ano);
  const ids = (turmas ?? []).map((t) => t.id);

  if (ids.length) {
    const [{ count: projetos }, { count: contas }] = await Promise.all([
      supabase.from("projeto").select("id", { count: "exact", head: true }).in("turma_id", ids),
      supabase.from("perfil").select("id", { count: "exact", head: true }).in("turma_id", ids),
    ]);
    if (projetos || contas) {
      return { erro: `O ano ${ano} tem projetos ou contas, então não pode ser removido.` };
    }
    const { error } = await supabase.from("turma").delete().eq("ano_letivo", ano);
    if (error) return { erro: "Não foi possível remover as turmas do ano." };
  }
  const { error } = await supabase.from("ano_letivo").delete().eq("ano", ano);
  if (error) return { erro: "Não foi possível remover o ano." };
  revalidar();
  return {};
}
