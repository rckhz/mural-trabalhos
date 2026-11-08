"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sessaoAtual } from "@/lib/sessao";

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789"; // sem 0/o, 1/l/i para não confundir

const senhaTemporaria = () =>
  Array.from({ length: 8 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");

async function garantirProfessora() {
  const s = await sessaoAtual();
  if (s?.perfil.funcao !== "professora") throw new Error("Acesso negado");
}

async function ehAluno(userId: string) {
  const { data } = await supabaseAdmin().from("perfil").select("funcao").eq("id", userId).maybeSingle();
  return data?.funcao === "aluno";
}

export type LinhaCadastro = { nome: string; email: string; senha?: string; erro?: string };
export type EstadoCadastro = { resultado: LinhaCadastro[]; erro?: string } | null;

// Aceita "Nome; e-mail", "Nome, e-mail" ou duas colunas coladas de uma planilha.
function lerLista(texto: string) {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(.+?)\s*[;,\t]\s*(\S+)$/);
      return m ? { nome: m[1].trim(), email: m[2].toLowerCase() } : { nome: l, email: "" };
    });
}

export async function cadastrarAlunos(_: EstadoCadastro, form: FormData): Promise<EstadoCadastro> {
  await garantirProfessora();
  const turmaId = String(form.get("turma_id") ?? "");
  const lista = lerLista(String(form.get("lista") ?? ""));
  if (!turmaId) return { resultado: [], erro: "Escolha a turma." };
  if (!lista.length) return { resultado: [], erro: "Cole pelo menos um aluno." };
  if (lista.length > 60) return { resultado: [], erro: "Envie no máximo 60 alunos por vez." };

  const admin = supabaseAdmin();
  const resultado: LinhaCadastro[] = [];

  for (const { nome, email } of lista) {
    if (nome.length < 2 || !FORMATO_EMAIL.test(email)) {
      resultado.push({ nome, email, erro: "Linha inválida (use: Nome; e-mail)" });
      continue;
    }
    const senha = senhaTemporaria();
    // email_confirm: a conta já nasce confirmada; nenhum e-mail é enviado.
    const { data, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true });
    if (error || !data.user) {
      resultado.push({
        nome,
        email,
        erro: error?.code === "email_exists" ? "E-mail já cadastrado" : "Não foi possível criar a conta",
      });
      continue;
    }
    const { error: erroPerfil } = await admin
      .from("perfil")
      .insert({ id: data.user.id, nome, funcao: "aluno", turma_id: turmaId });
    if (erroPerfil) {
      await admin.auth.admin.deleteUser(data.user.id); // não deixa conta sem perfil
      resultado.push({ nome, email, erro: "Não foi possível salvar o perfil" });
      continue;
    }
    resultado.push({ nome, email, senha });
  }

  revalidatePath("/painel/alunos");
  return { resultado };
}

export async function novaSenha(userId: string): Promise<{ senha?: string; erro?: string }> {
  await garantirProfessora();
  if (!(await ehAluno(userId))) return { erro: "Aluno não encontrado" };

  const admin = supabaseAdmin();
  const senha = senhaTemporaria();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: senha });
  if (error) return { erro: "Não foi possível gerar a senha" };
  await admin.from("perfil").update({ deve_trocar_senha: true }).eq("id", userId);
  revalidatePath("/painel/alunos");
  return { senha };
}

export async function definirAtivo(userId: string, ativo: boolean) {
  await garantirProfessora();
  if (!(await ehAluno(userId))) return;

  const admin = supabaseAdmin();
  await admin.auth.admin.updateUserById(userId, { ban_duration: ativo ? "none" : "876000h" });
  await admin.from("perfil").update({ ativo }).eq("id", userId);
  revalidatePath("/painel/alunos");
}
