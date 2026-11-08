"use server";

import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { destino, sessaoAtual } from "@/lib/sessao";

export async function entrar(_: string | null, form: FormData): Promise<string | null> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");
  if (!email || !senha) return "Preencha e-mail e senha.";

  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) {
    return error.code === "user_banned"
      ? "Esta conta está desativada. Fale com a professora."
      : "E-mail ou senha incorretos.";
  }

  const s = await sessaoAtual();
  if (!s) {
    await supabase.auth.signOut();
    return "Esta conta não tem acesso ao site. Fale com a professora.";
  }
  redirect(destino(s.perfil));
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
