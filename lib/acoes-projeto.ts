"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sessaoAtual } from "@/lib/sessao";

// Todas as ações usam o cliente com a sessão de quem está logado:
// quem decide se pode ou não é o RLS do banco (aluno só mexe na própria sala).

export type Resultado = { erro?: string; ok?: boolean };

async function sessao() {
  const s = await sessaoAtual();
  if (!s) throw new Error("Sessão expirada. Entre de novo.");
  return s;
}

// Enviar/remover PDF ou foto conta como edição do projeto: "toca" o projeto
// para o banco gravar quem editou por último (o gatilho preenche o nome).
async function tocar(s: Awaited<ReturnType<typeof sessao>>, projetoId: string) {
  await s.supabase.from("projeto").update({ atualizado_em: new Date().toISOString() }).eq("id", projetoId);
}

function revalidar(id: string) {
  revalidatePath(`/projeto/${id}/editar`);
  revalidatePath(`/projeto/${id}`);
  revalidatePath("/mural");
}

function lerDados(form: FormData) {
  return {
    titulo: String(form.get("titulo") ?? "").trim(),
    // O semestre é preenchido pelo banco a partir do bimestre.
    bimestre: Number(form.get("bimestre")),
    disciplina: String(form.get("disciplina") ?? "").trim() || null,
    descricao: String(form.get("descricao") ?? "").trim() || null,
  };
}

function validar(d: ReturnType<typeof lerDados>) {
  if (d.titulo.length < 3 || d.titulo.length > 120) return "O título precisa ter entre 3 e 120 caracteres.";
  if (![1, 2, 3, 4].includes(d.bimestre)) return "Escolha o bimestre.";
  if (d.descricao && d.descricao.length > 3000) return "A descrição pode ter no máximo 3000 caracteres.";
  return null;
}

export async function criarProjeto(_: string | null, form: FormData): Promise<string | null> {
  const s = await sessao();
  const d = lerDados(form);
  const erro = validar(d);
  if (erro) return erro;
  // Aluno sempre cria na própria sala; professor escolhe a turma.
  const turmaId = s.perfil.funcao === "professora" ? String(form.get("turma_id") ?? "") : s.perfil.turma_id;
  if (!turmaId) return "Escolha a turma.";

  const { data, error } = await s.supabase
    .from("projeto")
    .insert({ titulo: d.titulo, bimestre: d.bimestre, disciplina: d.disciplina, turma_id: turmaId })
    .select("id")
    .single();
  if (error || !data) return "Não foi possível criar o projeto.";
  redirect(`/projeto/${data.id}/editar`);
}

export async function salvarDados(_: Resultado | null, form: FormData): Promise<Resultado> {
  const s = await sessao();
  const id = String(form.get("id") ?? "");
  const d = lerDados(form);
  const erro = validar(d);
  if (erro) return { erro };

  const { data: atual } = await s.supabase.from("projeto").select("bimestre").eq("id", id).maybeSingle();
  if (!atual) return { erro: "Projeto não encontrado." };
  if (atual.bimestre !== d.bimestre) {
    const { count } = await s.supabase
      .from("documento")
      .select("id", { count: "exact", head: true })
      .eq("projeto_id", id);
    if (count) return { erro: "Não dá para mudar o bimestre de um projeto que já tem documento enviado." };
  }

  const { data, error } = await s.supabase.from("projeto").update(d).eq("id", id).select("id");
  if (error || !data?.length) return { erro: "Não foi possível salvar." };
  revalidar(id);
  return { ok: true };
}

export async function definirStatus(id: string, status: string): Promise<Resultado> {
  const s = await sessao();
  if (!["rascunho", "publicado", "oculto"].includes(status)) return { erro: "Situação inválida." };
  if (status === "oculto" && s.perfil.funcao !== "professora") return { erro: "Só o professor pode ocultar." };

  const { data, error } = await s.supabase.from("projeto").update({ status }).eq("id", id).select("id");
  if (error || !data?.length) return { erro: "Não foi possível alterar a situação." };
  revalidar(id);
  return {};
}

export async function excluirProjeto(id: string): Promise<Resultado> {
  const s = await sessao();
  if (s.perfil.funcao !== "professora") return { erro: "Só o professor pode excluir projetos." };

  // Apaga os arquivos do Storage antes (o banco não apaga arquivos sozinho).
  for (const bucket of ["documentos", "fotos"]) {
    const { data: arquivos } = await s.supabase.storage.from(bucket).list(id, { limit: 1000 });
    if (arquivos?.length) await s.supabase.storage.from(bucket).remove(arquivos.map((a) => `${id}/${a.name}`));
  }
  const { data: projeto } = await s.supabase.from("projeto").select("turma_id").eq("id", id).maybeSingle();
  const { error } = await s.supabase.from("projeto").delete().eq("id", id);
  if (error) return { erro: "Não foi possível excluir o projeto." };
  revalidatePath("/mural");
  redirect(projeto ? `/painel/projetos?turma=${projeto.turma_id}` : "/painel/projetos");
}

// Chamado depois que o navegador enviou o PDF ao Storage.
export async function salvarDocumento(projetoId: string, bimestre: number, caminho: string): Promise<Resultado> {
  const s = await sessao();
  if (!caminho.startsWith(`${projetoId}/`)) return { erro: "Arquivo inválido." };

  const { data: antigo } = await s.supabase
    .from("documento")
    .select("arquivo")
    .eq("projeto_id", projetoId)
    .eq("bimestre", bimestre)
    .maybeSingle();

  const { error } = await s.supabase
    .from("documento")
    .upsert({ projeto_id: projetoId, bimestre, arquivo: caminho, status: "publicado" }, { onConflict: "projeto_id,bimestre" });
  if (error) {
    return {
      erro: error.message.includes("bimestre")
        ? "O documento precisa ser do mesmo bimestre do projeto."
        : "Não foi possível salvar o documento.",
    };
  }
  // Substituição: apaga o PDF anterior para economizar espaço.
  if (antigo?.arquivo && antigo.arquivo !== caminho) {
    await s.supabase.storage.from("documentos").remove([antigo.arquivo]);
  }
  await tocar(s, projetoId);
  revalidar(projetoId);
  return {};
}

export async function removerDocumento(projetoId: string, bimestre: number): Promise<Resultado> {
  const s = await sessao();
  const { data: doc } = await s.supabase
    .from("documento")
    .select("arquivo")
    .eq("projeto_id", projetoId)
    .eq("bimestre", bimestre)
    .maybeSingle();
  if (!doc) return { erro: "Documento não encontrado." };

  const { error } = await s.supabase.from("documento").delete().eq("projeto_id", projetoId).eq("bimestre", bimestre);
  if (error) return { erro: "Não foi possível remover o documento." };
  await s.supabase.storage.from("documentos").remove([doc.arquivo]);
  await tocar(s, projetoId);
  revalidar(projetoId);
  return {};
}

// Chamado depois que o navegador enviou a foto (já reduzida) ao Storage.
export async function adicionarFoto(projetoId: string, caminho: string): Promise<Resultado> {
  const s = await sessao();
  if (!caminho.startsWith(`${projetoId}/`)) return { erro: "Arquivo inválido." };
  const { error } = await s.supabase.from("foto").insert({ projeto_id: projetoId, arquivo: caminho });
  if (error) return { erro: "Não foi possível salvar a foto." };
  await tocar(s, projetoId);
  revalidar(projetoId);
  return {};
}

export async function removerFoto(fotoId: string): Promise<Resultado> {
  const s = await sessao();
  const { data: foto } = await s.supabase.from("foto").select("arquivo, projeto_id").eq("id", fotoId).maybeSingle();
  if (!foto) return { erro: "Foto não encontrada." };

  const { error } = await s.supabase.from("foto").delete().eq("id", fotoId);
  if (error) return { erro: "Não foi possível remover a foto." };
  await s.supabase.storage.from("fotos").remove([foto.arquivo]);
  await tocar(s, foto.projeto_id);
  revalidar(foto.projeto_id);
  return {};
}
