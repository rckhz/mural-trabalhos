import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/servidor";

export type Perfil = {
  id: string;
  nome: string;
  funcao: "professora" | "aluno";
  turma_id: string | null;
  ativo: boolean;
  deve_trocar_senha: boolean;
};

// Usuário logado + perfil ativo, ou null.
export async function sessaoAtual() {
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase
    .from("perfil")
    .select("id, nome, funcao, turma_id, ativo, deve_trocar_senha")
    .eq("id", user.id)
    .maybeSingle<Perfil>();
  if (!perfil?.ativo) return null;
  return { supabase, user, perfil };
}

// Para onde cada conta vai depois do login.
export function destino(p: Perfil) {
  if (p.deve_trocar_senha) return "/trocar-senha";
  return p.funcao === "professora" ? "/painel" : "/sala";
}

// Protege uma página: sem sessão → login; função errada → a área certa.
export async function exigir(funcao: Perfil["funcao"]) {
  const s = await sessaoAtual();
  if (!s) redirect("/entrar");
  if (s.perfil.deve_trocar_senha || s.perfil.funcao !== funcao) redirect(destino(s.perfil));
  return s;
}
