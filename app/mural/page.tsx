import Link from "next/link";
import { ChevronRight, Folder, LogIn } from "lucide-react";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { Voltar } from "@/components/voltar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { textoAutoria } from "@/lib/projetos";

type Params = Promise<Record<string, string | string[] | undefined>>;
type TurmaPub = { serie: number; nome: string; ano_letivo: number };

const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const SERIES = [1, 2, 3];
const TURMAS = ["MIL", "MIN"];

// Endereço de cada pasta: /mural?ano=2026&serie=1&turma=MIL
function href(ano?: number, serie?: number, turma?: string) {
  const p = new URLSearchParams();
  if (ano) p.set("ano", String(ano));
  if (serie) p.set("serie", String(serie));
  if (turma) p.set("turma", turma);
  const q = p.toString();
  return q ? `/mural?${q}` : "/mural";
}

function Pasta({ para, nome, total }: { para: string; nome: string; total: number }) {
  return (
    <li>
      <Link
        href={para}
        className="group flex items-center gap-3 rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 outline-none transition hover:ring-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Folder className="size-8 shrink-0 fill-primary/15 text-primary" aria-hidden />
        <span className="min-w-0">
          <span className="block text-lg font-medium">{nome}</span>
          <span className="block text-sm text-muted-foreground">
            {total === 0 ? "Nenhum projeto" : total === 1 ? "1 projeto" : `${total} projetos`}
          </span>
        </span>
        <ChevronRight className="ml-auto size-5 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </li>
  );
}

export default async function Mural({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const supabase = await supabaseServidor();

  const [{ data: anosDb }, { data: publicados }] = await Promise.all([
    supabase.from("ano_letivo").select("ano").order("ano", { ascending: false }),
    supabase.from("projeto").select("turma!inner(serie, nome, ano_letivo)").eq("status", "publicado"),
  ]);
  const anos = (anosDb ?? []).map((a) => a.ano as number);
  const turmasPub = (publicados ?? []).map((p) => p.turma as unknown as TurmaPub);
  const contar = (ano: number, serie?: number, turma?: string) =>
    turmasPub.filter(
      (t) => t.ano_letivo === ano && (!serie || t.serie === serie) && (!turma || t.nome === turma),
    ).length;

  // Só desce um nível se o anterior for válido (endereço quebrado volta para cima).
  const ano = anos.find((a) => String(a) === um(sp.ano));
  const serie = ano ? SERIES.find((s) => String(s) === um(sp.serie)) : undefined;
  const turma = serie ? TURMAS.find((t) => t === um(sp.turma)) : undefined;

  const trilha = [
    { nome: "Mural", para: href() },
    ...(ano ? [{ nome: String(ano), para: href(ano) }] : []),
    ...(serie ? [{ nome: `${serie}º ano`, para: href(ano, serie) }] : []),
    ...(turma ? [{ nome: turma, para: href(ano, serie, turma) }] : []),
  ];
  const acima = trilha.at(-2);

  let projetos = null;
  let erro = false;
  if (ano && serie && turma) {
    const r = await supabase
      .from("projeto")
      .select("id, titulo, disciplina, bimestre, criado_por_nome, atualizado_por_nome, turma!inner(serie, nome, ano_letivo)")
      .eq("status", "publicado")
      .eq("turma.ano_letivo", ano)
      .eq("turma.serie", serie)
      .eq("turma.nome", turma)
      .order("bimestre")
      .order("criado_em", { ascending: false });
    projetos = r.data;
    erro = Boolean(r.error);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-16">
      <div className="flex items-start justify-between gap-2">
        {acima ? <Voltar href={acima.para}>Voltar</Voltar> : <Voltar href="/">Início</Voltar>}
        <Link href="/entrar" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <LogIn />Entrar para enviar trabalho
        </Link>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {turma ? `${serie}º ${turma} · ${ano}` : "Mural de projetos"}
      </h1>

      <nav aria-label="Caminho" className="mt-2">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {trilha.map((c, i) => (
            <li key={c.para} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
              {i === trilha.length - 1 ? (
                <span aria-current="page" className="font-medium text-foreground">{c.nome}</span>
              ) : (
                <Link href={c.para} className="hover:text-foreground hover:underline">{c.nome}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {!ano ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {anos.map((a) => <Pasta key={a} para={href(a)} nome={String(a)} total={contar(a)} />)}
        </ul>
      ) : !serie ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERIES.map((s) => <Pasta key={s} para={href(ano, s)} nome={`${s}º ano`} total={contar(ano, s)} />)}
        </ul>
      ) : !turma ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TURMAS.map((t) => (
            <Pasta key={t} para={href(ano, serie, t)} nome={`${serie}º ${t}`} total={contar(ano, serie, t)} />
          ))}
        </ul>
      ) : erro ? (
        <p className="py-12 text-center text-muted-foreground">
          Não foi possível carregar o mural. Tente novamente em instantes.
        </p>
      ) : !projetos?.length ? (
        <p className="py-12 text-center text-muted-foreground">Nenhum projeto publicado nesta turma ainda.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projetos.map((p) => {
            const autoria = textoAutoria(p.criado_por_nome, p.atualizado_por_nome);
            return (
              <li key={p.id}>
                <Link
                  href={`/projeto/${p.id}`}
                  className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Card className="h-full transition group-hover:ring-foreground/30">
                    <CardHeader>
                      <CardDescription>{p.bimestre}º bimestre</CardDescription>
                      <CardTitle className="text-lg"><h2>{p.titulo}</h2></CardTitle>
                    </CardHeader>
                    {p.disciplina && (
                      <CardContent>
                        <Badge variant="secondary">{p.disciplina}</Badge>
                      </CardContent>
                    )}
                    {autoria && (
                      <CardFooter className="mt-auto text-xs text-muted-foreground">{autoria}</CardFooter>
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
