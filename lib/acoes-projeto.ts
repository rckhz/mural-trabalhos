"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sessaoAtual } from "@/lib/sessao";
import { verificarTexto, type ErroOrtografia } from "@/lib/ortografia";

// Todas as ações usam o cliente com a sessão de quem está logado:
// quem decide se pode ou não é o RLS do banco (aluno só mexe na própria sala).

export type Resultado = { erro?: string; ok?: boolean };
type CriarEstado = { erro?: string; id?: string } | null;

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

// Só aceita links http(s) — nada de "javascript:" ou outros esquemas.
function lerLink(valor: FormDataEntryValue | string | null): { link: string | null; erro?: string } {
  const texto = String(valor ?? "").trim();
  if (!texto) return { link: null };
  try {
    const url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) throw new Error();
    if (url.href.length > 500) return { link: null, erro: "O link é muito longo." };
    return { link: url.href };
  } catch {
    return { link: null, erro: "Esse link não parece válido. Copie o endereço completo do slide." };
  }
}

function lerDados(form: FormData) {
  return {
    titulo: String(form.get("titulo") ?? "").trim(),
    semestre: Number(form.get("semestre")),
    // Sempre em maiúsculas e sem espaços sobrando: "ea", "Ea " e "EA" viram "EA".
    disciplina: String(form.get("disciplina") ?? "").trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR") || null,
    descricao: String(form.get("descricao") ?? "").trim() || null,
  };
}

function validar(d: ReturnType<typeof lerDados>) {
  if (d.titulo.length < 3 || d.titulo.length > 120) return "O título precisa ter entre 3 e 120 caracteres.";
  if (![1, 2].includes(d.semestre)) return "Escolha o semestre.";
  if (d.descricao && d.descricao.length > 3000) return "A descrição pode ter no máximo 3000 caracteres.";
  return null;
}

// Devolve o id para o navegador enviar a capa (se houver) e depois ir para a edição.
export async function criarProjeto(_: CriarEstado, form: FormData): Promise<CriarEstado> {
  const s = await sessao();
  const d = lerDados(form);
  const erro = validar(d);
  if (erro) return { erro };
  const cor = String(form.get("cor") ?? "").toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(cor)) return { erro: "Cor inválida." };
  // Aluno sempre cria na própria sala; professor escolhe a turma.
  const turmaId = s.perfil.funcao === "professora" ? String(form.get("turma_id") ?? "") : s.perfil.turma_id;
  if (!turmaId) return { erro: "Escolha a turma." };

  const { data, error } = await s.supabase
    .from("projeto")
    .insert({ titulo: d.titulo, semestre: d.semestre, disciplina: d.disciplina, turma_id: turmaId, cor })
    .select("id")
    .single();
  if (error || !data) return { erro: "Não foi possível criar o projeto." };
  return { id: data.id };
}

export async function salvarCor(projetoId: string, cor: string): Promise<Resultado> {
  const s = await sessao();
  const valor = cor.toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(valor)) return { erro: "Cor inválida." };
  const { data, error } = await s.supabase.from("projeto").update({ cor: valor }).eq("id", projetoId).select("id");
  if (error || !data?.length) return { erro: "Não foi possível salvar a cor." };
  await tocar(s, projetoId);
  revalidar(projetoId);
  return { ok: true };
}

export async function removerCapa(projetoId: string): Promise<Resultado> {
  const s = await sessao();
  const { data: atual } = await s.supabase.from("projeto").select("capa").eq("id", projetoId).maybeSingle();
  if (!atual) return { erro: "Projeto não encontrado." };
  const { data, error } = await s.supabase.from("projeto").update({ capa: null }).eq("id", projetoId).select("id");
  if (error || !data?.length) return { erro: "Não foi possível remover a capa." };
  if (atual.capa) await s.supabase.storage.from("capas").remove([atual.capa]);
  await tocar(s, projetoId);
  revalidar(projetoId);
  return { ok: true };
}

// Chamado depois que o navegador enviou a capa ao Storage (bucket "capas").
export async function salvarCapa(projetoId: string, caminho: string): Promise<Resultado> {
  const s = await sessao();
  if (!caminho.startsWith(`${projetoId}/`)) return { erro: "Arquivo inválido." };

  const { data: antiga } = await s.supabase.from("projeto").select("capa").eq("id", projetoId).maybeSingle();
  const { data, error } = await s.supabase.from("projeto").update({ capa: caminho }).eq("id", projetoId).select("id");
  if (error || !data?.length) return { erro: "Não foi possível salvar a capa." };
  // Troca de capa: apaga a anterior para economizar espaço.
  if (antiga?.capa && antiga.capa !== caminho) await s.supabase.storage.from("capas").remove([antiga.capa]);
  await tocar(s, projetoId);
  revalidar(projetoId);
  return { ok: true };
}

export async function salvarDados(_: Resultado | null, form: FormData): Promise<Resultado> {
  const s = await sessao();
  const id = String(form.get("id") ?? "");
  const d = lerDados(form);
  const erro = validar(d);
  if (erro) return { erro };

  const { data, error } = await s.supabase.from("projeto").update(d).eq("id", id).select("id");
  if (error || !data?.length) return { erro: "Não foi possível salvar." };
  revalidar(id);
  return { ok: true };
}

// Corretor ortográfico no próprio servidor (sem serviço externo). Só para quem está logado.
export async function verificarOrtografia(texto: string): Promise<{ erros?: ErroOrtografia[]; erro?: string }> {
  await sessao();
  try {
    return { erros: await verificarTexto(String(texto ?? "").slice(0, 3500)) };
  } catch (e) {
    console.error("Corretor ortográfico falhou:", e);
    return { erro: "Não foi possível verificar a ortografia agora." };
  }
}

// Link do slide (Google Apresentações, Canva, OneDrive...). Vazio = remover.
export async function salvarLinkSlide(projetoId: string, valor: string): Promise<Resultado> {
  const s = await sessao();
  const { link, erro } = lerLink(valor);
  if (erro) return { erro };

  const { data: projeto } = await s.supabase.from("projeto").select("status").eq("id", projetoId).maybeSingle();
  if (!link && projeto?.status === "publicado") {
    return { erro: "Projeto publicado precisa do link do slide. Troque o link, ou volte para rascunho antes de remover." };
  }
  const { data, error } = await s.supabase.from("projeto").update({ link_slide: link }).eq("id", projetoId).select("id");
  if (error || !data?.length) return { erro: "Não foi possível salvar o link." };
  revalidar(projetoId);
  return { ok: true };
}

export async function definirStatus(id: string, status: string): Promise<Resultado> {
  const s = await sessao();
  if (!["rascunho", "publicado", "oculto"].includes(status)) return { erro: "Situação inválida." };
  if (status === "oculto" && s.perfil.funcao !== "professora") return { erro: "Só o professor pode ocultar." };
  if (status === "publicado") {
    // Para publicar: documento em PDF + link do slide.
    const [{ data: projeto }, { count }] = await Promise.all([
      s.supabase.from("projeto").select("link_slide").eq("id", id).maybeSingle(),
      s.supabase.from("documento").select("id", { count: "exact", head: true }).eq("projeto_id", id),
    ]);
    const faltam = [!count && "o documento em PDF", !projeto?.link_slide && "o link do slide"].filter(Boolean);
    if (faltam.length) return { erro: `Para publicar, envie ${faltam.join(" e ")}.` };
  }

  const { data, error } = await s.supabase.from("projeto").update({ status }).eq("id", id).select("id");
  if (error || !data?.length) return { erro: "Não foi possível alterar a situação." };
  revalidar(id);
  return {};
}

export async function excluirProjeto(id: string): Promise<Resultado> {
  const s = await sessao();
  if (s.perfil.funcao !== "professora") return { erro: "Só o professor pode excluir projetos." };

  // Apaga os arquivos do Storage antes (o banco não apaga arquivos sozinho).
  for (const bucket of ["documentos", "fotos", "capas"]) {
    const { data: arquivos } = await s.supabase.storage.from(bucket).list(id, { limit: 1000 });
    if (arquivos?.length) await s.supabase.storage.from(bucket).remove(arquivos.map((a) => `${id}/${a.name}`));
  }
  const { data: projeto } = await s.supabase.from("projeto").select("turma_id").eq("id", id).maybeSingle();
  const { error } = await s.supabase.from("projeto").delete().eq("id", id);
  if (error) return { erro: "Não foi possível excluir o projeto." };
  revalidatePath("/mural");
  redirect(projeto ? `/painel/projetos?turma=${projeto.turma_id}` : "/painel/projetos");
}

// Chamado depois que o navegador enviou o PDF ao Storage. 1 PDF por projeto.
export async function salvarDocumento(projetoId: string, caminho: string): Promise<Resultado> {
  const s = await sessao();
  if (!caminho.startsWith(`${projetoId}/`) || !caminho.endsWith(".pdf")) return { erro: "Arquivo inválido." };

  const { data: antigo } = await s.supabase
    .from("documento")
    .select("arquivo")
    .eq("projeto_id", projetoId)
    .eq("formato", "pdf")
    .maybeSingle();

  const { error } = await s.supabase
    .from("documento")
    .upsert(
      { projeto_id: projetoId, formato: "pdf", arquivo: caminho, status: "publicado" },
      { onConflict: "projeto_id,formato" },
    );
  if (error) return { erro: "Não foi possível salvar o documento." };
  // Substituição: apaga o arquivo anterior para economizar espaço.
  if (antigo?.arquivo && antigo.arquivo !== caminho) {
    await s.supabase.storage.from("documentos").remove([antigo.arquivo]);
  }
  await tocar(s, projetoId);
  revalidar(projetoId);
  return {};
}

export async function removerDocumento(projetoId: string): Promise<Resultado> {
  const s = await sessao();
  // Projeto publicado precisa do PDF: dá para substituir, mas não remover.
  const { data: projeto } = await s.supabase.from("projeto").select("status").eq("id", projetoId).maybeSingle();
  if (projeto?.status === "publicado") {
    return { erro: "Projeto publicado precisa do PDF. Use Substituir, ou volte para rascunho antes de remover." };
  }
  const { data: doc } = await s.supabase
    .from("documento")
    .select("id, arquivo")
    .eq("projeto_id", projetoId)
    .maybeSingle();
  if (!doc) return { erro: "Documento não encontrado." };

  const { error } = await s.supabase.from("documento").delete().eq("id", doc.id);
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
