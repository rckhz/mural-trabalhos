import Link from "next/link";
import { LogIn, Search } from "lucide-react";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { Voltar } from "@/components/voltar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Params = Promise<Record<string, string | string[] | undefined>>;
const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

// <select> nativo: no celular abre o seletor do próprio sistema, mais fácil de usar.
const classeSelect =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function Filtro({ rotulo, nome, valor, opcoes }: {
  rotulo: string;
  nome: string;
  valor: string;
  opcoes: [string, string][];
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={nome}>{rotulo}</Label>
      <select id={nome} name={nome} defaultValue={valor} className={classeSelect}>
        {opcoes.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </div>
  );
}

export default async function Mural({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const f = {
    ano: um(sp.ano),
    serie: um(sp.serie),
    turma: um(sp.turma),
    bimestre: um(sp.bimestre),
    disciplina: um(sp.disciplina),
    q: um(sp.q).trim(),
  };

  const supabase = await supabaseServidor();

  const [{ data: anos }, { data: comDisciplina }] = await Promise.all([
    supabase.from("ano_letivo").select("ano, atual").order("ano", { ascending: false }),
    supabase.from("projeto").select("disciplina").eq("status", "publicado").not("disciplina", "is", null),
  ]);
  const anoPadrao = String(anos?.find((a) => a.atual)?.ano ?? anos?.[0]?.ano ?? "");
  const ano = f.ano || anoPadrao;
  const disciplinas = [...new Set((comDisciplina ?? []).map((p) => p.disciplina as string))].sort();

  let consulta = supabase
    .from("projeto")
    .select("id, titulo, disciplina, bimestre, criado_em, turma!inner(serie, nome, ano_letivo)")
    .eq("status", "publicado")
    .order("criado_em", { ascending: false });
  if (ano && ano !== "todos") consulta = consulta.eq("turma.ano_letivo", ano);
  if (f.serie) consulta = consulta.eq("turma.serie", f.serie);
  if (f.turma) consulta = consulta.eq("turma.nome", f.turma);
  if (f.bimestre) consulta = consulta.eq("bimestre", f.bimestre);
  if (f.disciplina) consulta = consulta.eq("disciplina", f.disciplina);
  if (f.q) consulta = consulta.textSearch("busca", f.q, { type: "websearch", config: "portuguese" });

  const { data: projetos, error } = await consulta;
  const filtrando = Boolean(f.serie || f.turma || f.bimestre || f.disciplina || f.q || (f.ano && f.ano !== anoPadrao));

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-16">
      <div className="flex items-start justify-between gap-2">
        <Voltar href="/">Início</Voltar>
        <Link href="/entrar" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <LogIn />Entrar para enviar trabalho
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mural de projetos</h1>
      <p className="mt-1 text-muted-foreground">Os mais recentes aparecem primeiro.</p>

      <Card className="mt-6">
        <CardContent>
          <form action="/mural" role="search" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="q">Buscar</Label>
              <Input id="q" type="search" name="q" defaultValue={f.q} placeholder="Título ou descrição" />
            </div>
            <Filtro rotulo="Ano letivo" nome="ano" valor={ano}
              opcoes={[["todos", "Todos"], ...(anos ?? []).map((a): [string, string] => [String(a.ano), String(a.ano)])]} />
            <Filtro rotulo="Série" nome="serie" valor={f.serie}
              opcoes={[["", "Todas"], ["1", "1º ano"], ["2", "2º ano"], ["3", "3º ano"]]} />
            <Filtro rotulo="Turma" nome="turma" valor={f.turma}
              opcoes={[["", "Todas"], ["MIL", "MIL"], ["MIN", "MIN"]]} />
            <Filtro rotulo="Bimestre" nome="bimestre" valor={f.bimestre}
              opcoes={[["", "Todos"], ["1", "1º bimestre"], ["2", "2º bimestre"], ["3", "3º bimestre"], ["4", "4º bimestre"]]} />
            {disciplinas.length > 0 && (
              <Filtro rotulo="Disciplina" nome="disciplina" valor={f.disciplina}
                opcoes={[["", "Todas"], ...disciplinas.map((d): [string, string] => [d, d])]} />
            )}
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
              <Button type="submit"><Search />Filtrar</Button>
              {filtrando && (
                <Link href="/mural" className={buttonVariants({ variant: "ghost" })}>Limpar filtros</Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <p className="py-12 text-center text-muted-foreground">
          Não foi possível carregar o mural. Tente novamente em instantes.
        </p>
      ) : !projetos?.length ? (
        <p className="py-12 text-center text-muted-foreground">
          Nenhum projeto encontrado{filtrando ? " com esses filtros" : " ainda"}.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projetos.map((p) => {
            const t = p.turma as unknown as { serie: number; nome: string };
            return (
              <li key={p.id}>
                <Link
                  href={`/projeto/${p.id}`}
                  className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Card className="h-full transition group-hover:ring-foreground/30">
                    <CardHeader>
                      <CardDescription>{t.serie}º {t.nome} · {p.bimestre}º bimestre</CardDescription>
                      <CardTitle className="text-lg"><h2>{p.titulo}</h2></CardTitle>
                    </CardHeader>
                    {p.disciplina && (
                      <CardContent className="mt-auto">
                        <Badge variant="secondary">{p.disciplina}</Badge>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
