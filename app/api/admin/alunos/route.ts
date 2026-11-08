import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomInt } from "node:crypto";

// Cadastro e gestão de contas de aluno. Roda só no servidor (Vercel).
// SUPABASE_SERVICE_ROLE_KEY: variável de ambiente SEM o prefixo NEXT_PUBLIC_.
// O cliente chama com o header: Authorization: Bearer <access_token da professora>

export const maxDuration = 60;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789"; // sem 0/o, 1/l/i para não confundir

function senhaTemporaria() {
  return Array.from({ length: 8 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
}

async function ehProfessora(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return false;
  const { data } = await admin.auth.getUser(token);
  if (!data.user) return false;
  const { data: perfil } = await admin
    .from("perfil")
    .select("funcao, ativo")
    .eq("id", data.user.id)
    .single();
  return perfil?.funcao === "professora" && perfil.ativo;
}

const negado = () => NextResponse.json({ erro: "Acesso negado" }, { status: 403 });

// POST — cadastra alunos de uma turma.
// Corpo: { turma_id: string, alunos: [{ nome, email }] }
// O e-mail só precisa ter formato válido: a conta já nasce confirmada, nenhum e-mail é enviado.
// As senhas temporárias aparecem SÓ nesta resposta — a tela deve permitir imprimir/baixar.
export async function POST(req: Request) {
  if (!(await ehProfessora(req))) return negado();

  const { turma_id, alunos } = await req.json();
  if (typeof turma_id !== "string" || !Array.isArray(alunos) || alunos.length < 1 || alunos.length > 60) {
    return NextResponse.json({ erro: "Envie turma_id e de 1 a 60 alunos (uma turma por vez)" }, { status: 400 });
  }

  const resultado: { nome: string; email: string; senha?: string; erro?: string }[] = [];

  for (const a of alunos) {
    const nome = String(a?.nome ?? "").trim();
    const email = String(a?.email ?? "").trim().toLowerCase();
    if (nome.length < 2 || !FORMATO_EMAIL.test(email)) {
      resultado.push({ nome, email, erro: "Nome ou e-mail inválido" });
      continue;
    }

    const senha = senhaTemporaria();
    const { data, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true });
    if (error || !data.user) {
      resultado.push({ nome, email, erro: error?.message ?? "Falha ao criar conta" });
      continue;
    }

    const { error: erroPerfil } = await admin
      .from("perfil")
      .insert({ id: data.user.id, nome, funcao: "aluno", turma_id });
    if (erroPerfil) {
      await admin.auth.admin.deleteUser(data.user.id); // não deixa conta sem perfil
      resultado.push({ nome, email, erro: erroPerfil.message });
      continue;
    }

    resultado.push({ nome, email, senha });
  }

  return NextResponse.json({ resultado });
}

// PATCH — { user_id, acao: "resetar_senha" | "desativar" | "reativar" }
// Como os e-mails não são verificados, a recuperação de acesso é sempre pela professora.
export async function PATCH(req: Request) {
  if (!(await ehProfessora(req))) return negado();

  const { user_id, acao } = await req.json();
  const { data: alvo } = await admin.from("perfil").select("funcao").eq("id", user_id).single();
  if (alvo?.funcao !== "aluno") {
    return NextResponse.json({ erro: "Aluno não encontrado" }, { status: 404 });
  }

  if (acao === "resetar_senha") {
    const senha = senhaTemporaria();
    const { error } = await admin.auth.admin.updateUserById(user_id, { password: senha });
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    await admin.from("perfil").update({ deve_trocar_senha: true }).eq("id", user_id);
    return NextResponse.json({ senha });
  }

  if (acao === "desativar" || acao === "reativar") {
    const ativo = acao === "reativar";
    const { error } = await admin.auth.admin.updateUserById(user_id, {
      ban_duration: ativo ? "none" : "876000h",
    });
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    await admin.from("perfil").update({ ativo }).eq("id", user_id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ erro: "Ação inválida" }, { status: 400 });
}
