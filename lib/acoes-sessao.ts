"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { configPublica } from "@/lib/supabase/config";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { destino, sessaoAtual, type Perfil } from "@/lib/sessao";

export async function entrar(_: string | null, form: FormData): Promise<string | null> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");
  if (!email || !senha) return "Preencha e-mail e senha.";

  const supabase = await supabaseServidor();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) {
    if (error.code === "user_banned") return "Esta conta está desativada. Fale com a professora.";
    if (error.code === "email_not_confirmed") return "Este e-mail ainda não foi confirmado no Supabase.";
    return "E-mail ou senha incorretos.";
  }

  // Lê o perfil com o token recém-emitido: os cookies da nova sessão
  // só ficam disponíveis com certeza na próxima requisição.
  const { url, chave } = configPublica();
  const { data: perfil } = await createClient(url, chave, {
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
    .from("perfil")
    .select("id, nome, funcao, turma_id, ativo, deve_trocar_senha")
    .eq("id", data.user.id)
    .maybeSingle<Perfil>();

  if (!perfil?.ativo) {
    await supabase.auth.signOut();
    return perfil
      ? "Esta conta está desativada. Fale com a professora."
      : "Esta conta ainda não tem perfil no site. Fale com a professora.";
  }
  redirect(destino(perfil));
}

export async function trocarSenha(_: string | null, form: FormData): Promise<string | null> {
  const senha = String(form.get("senha") ?? "");
  const confirma = String(form.get("confirma") ?? "");
  if (senha.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (senha !== confirma) return "As duas senhas não são iguais.";

  const s = await sessaoAtual();
  if (!s) redirect("/entrar");

  const { error } = await s.supabase.auth.updateUser({ password: senha });
  if (error) {
    return error.code === "same_password"
      ? "Escolha uma senha diferente da temporária."
      : "Não foi possível trocar a senha. Tente de novo.";
  }
  await s.supabase.rpc("marcar_senha_trocada");
  redirect(destino({ ...s.perfil, deve_trocar_senha: false }));
}

export async function sair() {
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  redirect("/");
}
