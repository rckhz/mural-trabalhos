import type { Perfil } from "@/lib/sessao";

export type StatusProjeto = "rascunho" | "publicado" | "oculto";

// Mesma regra do RLS (pode_editar_projeto), usada para montar a tela.
export function podeEditar(perfil: Perfil, projeto: { turma_id: string; status: string }) {
  if (perfil.funcao === "professora") return true;
  return perfil.turma_id === projeto.turma_id && projeto.status !== "oculto";
}

export const classeCampo =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
