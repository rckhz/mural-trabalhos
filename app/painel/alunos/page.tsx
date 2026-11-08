import Link from "next/link";
import { CabecalhoArea } from "@/components/cabecalho-area";
import { Voltar } from "@/components/voltar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { exigir } from "@/lib/sessao";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AcoesAluno } from "./acoes-aluno";
import { BotaoRemover } from "./botao-remover";
import { CadastroAlunos } from "./cadastro";
import { InterruptorAdmin } from "./interruptor-admin";

// Cadastro em lote cria várias contas seguidas; dá tempo de sobra.
export const maxDuration = 60;

type Turma = { id: string; serie: number; nome: string; ano_letivo: number };
type Conta = { id: string; nome: string; funcao: "professora" | "aluno"; ativo: boolean; deve_trocar_senha: boolean };
const rotulo = (t: Turma) => `${t.serie}º ${t.nome} · ${t.ano_letivo}`;
const CAMPOS = "id, nome, funcao, ativo, deve_trocar_senha";

export default async function Alunos({ searchParams }: { searchParams: Promise<{ turma?: string }> }) {
  const { supabase, perfil, user } = await exigir("professora");
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

  const [{ data: membros }, { data: admins }, { data: usuarios }] = await Promise.all([
    sel
      ? supabase.from("perfil").select(CAMPOS).eq("turma_id", sel.id).order("nome").returns<Conta[]>()
      : Promise.resolve({ data: [] as Conta[] }),
    supabase.from("perfil").select(CAMPOS).eq("funcao", "professora").order("nome").returns<Conta[]>(),
    // O e-mail fica no Auth, não na tabela perfil.
    supabaseAdmin().auth.admin.listUsers({ perPage: 1000 }),
  ]);
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
                <h2>{sel ? rotulo(sel) : "Nenhuma turma"} · {membros?.length ?? 0} contas</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!membros?.length ? (
                <p className="text-muted-foreground">Nenhum aluno cadastrado nesta turma ainda.</p>
              ) : (
                <ul className="divide-y">
                  {membros.map((a) => (
                    <li key={a.id} className="grid gap-2 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {a.nome}
                            {a.funcao === "professora" && <Badge className="ml-2">administrador</Badge>}
                            {!a.ativo && <Badge variant="destructive" className="ml-2">desativado</Badge>}
                            {a.ativo && a.deve_trocar_senha && (
                              <Badge variant="secondary" className="ml-2">aguardando 1º acesso</Badge>
                            )}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">{emailPorId.get(a.id)}</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {a.funcao === "aluno" && <AcoesAluno id={a.id} ativo={a.ativo} />}
                          {a.id !== user.id && <BotaoRemover id={a.id} nome={a.nome} />}
                        </div>
                      </div>
                      <InterruptorAdmin id={a.id} admin={a.funcao === "professora"} proprio={a.id === user.id} />
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

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg"><h2>Professores e administradores</h2></CardTitle>
            <CardDescription>
              Contas com acesso total ao painel. Para criar uma, escolha &quot;Professor&quot; em Cadastrar contas.
              Também dá para dar acesso a um aluno ligando o interruptor na lista da turma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {(admins ?? []).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {a.nome}
                      {a.id === user.id && <Badge variant="secondary" className="ml-2">você</Badge>}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{emailPorId.get(a.id)}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <InterruptorAdmin id={a.id} admin proprio={a.id === user.id} />
                    {a.id !== user.id && <BotaoRemover id={a.id} nome={a.nome} />}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
