import Link from "next/link";
import { CabecalhoArea } from "@/components/cabecalho-area";
import { Voltar } from "@/components/voltar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exigir } from "@/lib/sessao";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AcoesAluno } from "./acoes-aluno";
import { CadastroAlunos } from "./cadastro";

// Cadastro em lote cria várias contas seguidas; dá tempo de sobra.
export const maxDuration = 60;

type Turma = { id: string; serie: number; nome: string; ano_letivo: number };
const rotulo = (t: Turma) => `${t.serie}º ${t.nome} · ${t.ano_letivo}`;

export default async function Alunos({ searchParams }: { searchParams: Promise<{ turma?: string }> }) {
  const { supabase, perfil } = await exigir("professora");
  const { turma } = await searchParams;

  const { data: turmas } = await supabase
    .from("turma")
    .select("id, serie, nome, ano_letivo")
    .order("ano_letivo", { ascending: false })
    .order("serie")
    .order("nome")
    .returns<Turma[]>();
  const lista = turmas ?? [];
  const sel = lista.find((t) => t.id === turma) ?? lista[0];

  const { data: alunos } = sel
    ? await supabase
        .from("perfil")
        .select("id, nome, ativo, deve_trocar_senha")
        .eq("funcao", "aluno")
        .eq("turma_id", sel.id)
        .order("nome")
    : { data: [] };

  // O e-mail fica no Auth, não na tabela perfil.
  const { data: usuarios } = await supabaseAdmin().auth.admin.listUsers({ perPage: 1000 });
  const emailPorId = new Map((usuarios?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  return (
    <>
      <CabecalhoArea titulo="Painel do professor" nome={perfil.nome} />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-16">
        <Voltar href="/painel">Painel</Voltar>
        <h1 className="text-2xl font-semibold tracking-tight">Alunos</h1>

        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Turmas">
          {lista.map((t) => (
            <Link
              key={t.id}
              href={`/painel/alunos?turma=${t.id}`}
              aria-current={t.id === sel?.id ? "page" : undefined}
              className={buttonVariants({ variant: t.id === sel?.id ? "default" : "outline", size: "sm" })}
            >
              {t.serie}º {t.nome}
            </Link>
          ))}
        </nav>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <h2>{sel ? rotulo(sel) : "Nenhuma turma"} · {alunos?.length ?? 0} alunos</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!alunos?.length ? (
                <p className="text-muted-foreground">Nenhum aluno cadastrado nesta turma ainda.</p>
              ) : (
                <ul className="divide-y">
                  {alunos.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {a.nome}
                          {!a.ativo && <Badge variant="destructive" className="ml-2">desativado</Badge>}
                          {a.ativo && a.deve_trocar_senha && (
                            <Badge variant="secondary" className="ml-2">aguardando 1º acesso</Badge>
                          )}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{emailPorId.get(a.id)}</p>
                      </div>
                      <AcoesAluno id={a.id} ativo={a.ativo} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <CadastroAlunos
            key={sel?.id}
            turmas={lista.map((t) => ({ id: t.id, rotulo: rotulo(t) }))}
            turmaPadrao={sel?.id}
          />
        </div>
      </main>
    </>
  );
}
