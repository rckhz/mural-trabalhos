import Link from "next/link";
import { LinkTrabalho } from "./link-trabalho";
import { ChevronDown, FolderOpen, LogIn, Search } from "lucide-react";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { textoAutoria } from "@/lib/projetos";

type Params = Promise<Record<string, string | string[] | undefined>>;
type TurmaPub = { serie: number; nome: string; ano_letivo: number };
type Contar = (ano: number, serie?: number, turma?: string) => number;

const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const SERIES = [1, 2, 3];
const TURMAS = ["MIL", "MIN"];

// Endereço de cada filtro: /mural?ano=2026&serie=1&turma=MIL
function href(ano?: number, serie?: number, turma?: string, busca?: string) {
  const p = new URLSearchParams();
  if (ano) p.set("ano", String(ano));
  if (serie) p.set("serie", String(serie));
  if (turma) p.set("turma", turma);
  if (busca) p.set("q", busca);
  const q = p.toString();
  return q ? `/mural?${q}` : "/mural";
}

function Item({
  para,
  ativo,
  caminhoAtivo,
  total,
  recuo,
  children,
}: {
  para: string;
  ativo: boolean;
  caminhoAtivo?: boolean;
  total: number;
  recuo: 0 | 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={para}
      aria-current={ativo ? "page" : undefined}
      // focus-visible garante acessibilidade sem comprometer o design no clique normal
      className={`group flex min-h-11 items-center justify-between gap-2 rounded-lg py-1.5 pr-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${recuo === 0
          ? "pl-2 text-[15px]" // Ano
          : recuo === 1
            ? "pl-2 text-[14px]" // Série
            : "pl-3 text-[14px]" // Turma
        } ${ativo
          ? "bg-secondary text-secondary-foreground font-semibold"
          : caminhoAtivo
            ? "text-zinc-800 font-bold dark:text-zinc-100" // Itens "pais" abertos ficam destacados em negrito
            : "text-zinc-500 font-medium hover:bg-black/5 hover:text-zinc-700 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-zinc-100"
        }`}
    >
      <span className="truncate">{children}</span>

      <span
        className={`flex h-[22px] min-w-[24px] items-center justify-center rounded-md px-1.5 text-[11px] font-bold tabular-nums transition-colors ${ativo
            ? "bg-primary text-primary-foreground"
            : "bg-black/5 text-zinc-600 group-hover:bg-black/10 group-hover:text-zinc-600 dark:bg-white/10 dark:text-zinc-300 dark:group-hover:bg-white/20" // Badges inativos cinzentos
          }`}
      >
        {total}
      </span>
    </Link>
  );
}

// Árvore Ano › Série › Turma. Só o ano escolhido fica aberto.
function Menu({ anos, ano, serie, turma, contar, busca }: {
  anos: number[]; ano?: number; serie?: number; turma?: string; contar: Contar; busca: string;
}) {
  return (
    <nav aria-label="Filtrar projetos">
      <ul className="flex flex-col gap-1.5">
        {anos.map((a) => {
          const anoAberto = a === ano;
          return (
            <li key={a} className="flex flex-col gap-1">
              <Item para={href(a, undefined, undefined, busca)} ativo={anoAberto && !serie} caminhoAtivo={anoAberto} total={contar(a)} recuo={0}>
                {a}
              </Item>

              {anoAberto && (
                <div className="ml-[15px] border-l-2 border-border pl-3 mt-1">
                  <ul className="flex flex-col gap-1">
                    {SERIES.map((s) => {
                      const serieAberta = s === serie;
                      return (
                        <li key={s} className="flex flex-col gap-1">
                          <Item para={href(a, s, undefined, busca)} ativo={serieAberta && !turma} caminhoAtivo={serieAberta} total={contar(a, s)} recuo={1}>
                            {s}º ano
                          </Item>

                          {serieAberta && (
                            <div className="ml-[15px] border-l-2 border-border pl-3 mt-1 mb-1">
                              <ul className="flex flex-col gap-1">
                                {TURMAS.map((t) => (
                                  <li key={t}>
                                    <Item para={href(a, s, t, busca)} ativo={serieAberta && t === turma} total={contar(a, s, t)} recuo={2}>
                                      {s}º {t}
                                    </Item>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default async function Mural({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const supabase = await supabaseServidor();

  const busca = um(sp.q).trim().slice(0, 120);
  const normalizar = (texto: string) => texto.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
  const termo = normalizar(busca);

  // Lê o índice em páginas para incluir anos anteriores mesmo em acervos grandes.
  async function indicePublicado() {
    const pagina = (inicio: number) => supabase.from("projeto")
      .select("id, titulo, disciplina, turma!inner(serie, nome, ano_letivo)")
      .eq("status", "publicado").order("id").range(inicio, inicio + 499);
    const itens = [];
    for (let inicio = 0; ; inicio += 500) {
      const { data, error } = await pagina(inicio);
      if (error) return { itens: [], erro: true };
      for (const p of data) {
        if (!termo || normalizar(p.titulo).includes(termo) || normalizar(p.disciplina ?? "").includes(termo)) {
          itens.push({ id: p.id, turma: p.turma as unknown as TurmaPub });
        }
      }
      if (data.length < 500) return { itens, erro: false };
    }
  }
  const [anosDb, indice] = await Promise.all([
    supabase.from("ano_letivo").select("ano").order("ano", { ascending: false }),
    indicePublicado(),
  ]);
  const anos = (anosDb.data ?? []).map((a) => a.ano as number);
  const contar: Contar = (ano, serie, turma) => indice.itens.filter(({ turma: t }) =>
    t.ano_letivo === ano && (!serie || t.serie === serie) && (!turma || t.nome === turma)).length;
  const anoAtual = Number(new Intl.DateTimeFormat("en-CA", { year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date()));
  const explicito = anos.find((a) => String(a) === um(sp.ano));
  const ano = explicito ?? (busca ? undefined : anos.find((a) => a <= anoAtual) ?? anos.at(-1));
  const serie = SERIES.find((s) => String(s) === um(sp.serie));
  const turma = TURMAS.find((t) => t === um(sp.turma));
  const ids = indice.itens.filter(({ turma: t }) => (!ano || t.ano_letivo === ano) &&
    (!serie || t.serie === serie) && (!turma || t.nome === turma)).map((p) => p.id);
  const projetos = [];
  let erro = Boolean(anosDb.error || indice.erro);
  for (let inicio = 0; inicio < ids.length; inicio += 100) {
    const { data, error } = await supabase.from("projeto")
      .select("id, titulo, disciplina, semestre, cor, capa, link_slide, documento(id), foto(count), criado_em, criado_por_nome, atualizado_por_nome, turma!inner(serie, nome, ano_letivo)")
      .eq("status", "publicado").in("id", ids.slice(inicio, inicio + 100));
    if (error) { erro = true; break; }
    projetos.push(...data.map((p) => ({ ...p, turma: p.turma as unknown as TurmaPub })));
  }
  projetos.sort((a, b) => b.turma.ano_letivo - a.turma.ano_letivo || a.turma.serie - b.turma.serie ||
    a.turma.nome.localeCompare(b.turma.nome) || a.semestre - b.semestre || b.criado_em.localeCompare(a.criado_em));
  // Capas são de bucket privado: um link temporário (1 h) para cada projeto que tem capa.
  const caminhosCapa = (projetos ?? []).flatMap((p) => (p.capa ? [p.capa] : []));
  const capaUrls = new Map<string, string>();
  if (caminhosCapa.length) {
    const { data: links } = await supabase.storage.from("capas").createSignedUrls(caminhosCapa, 3600);
    for (const l of links ?? []) if (l.path && l.signedUrl) capaUrls.set(l.path, l.signedUrl);
  }

  const origem = href(explicito, serie, turma, busca);
  const escolha = [ano, serie && `${serie}º ano`, turma].filter(Boolean).join(" · ");
  const menu = <Menu anos={anos} ano={ano} serie={serie} turma={turma} contar={contar} busca={busca} />;

  return (
    <div className="lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r bg-card lg:flex">
        <Link href="/" className="flex min-h-20 items-center gap-3 border-b px-6 font-semibold tracking-tight">
          <FolderOpen className="size-5 text-primary" aria-hidden /> Projetos ETEC
        </Link>
        <div className="flex-1 px-4 py-6">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ano letivo</p>
          {menu}
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 pb-20 sm:px-8 lg:pr-6 lg:pl-16">
        <div className="max-w-6xl">
          <header className="flex min-h-20 items-center justify-between gap-4 border-b">
            <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium hover:underline">ETEC Dra. Ruth Cardoso</Link>
            <Link href="/entrar" className={buttonVariants({ variant: "outline", className: "min-h-11 px-4" })}>
              <LogIn /> Entrar
            </Link>
          </header>
          <h1 className="mt-9 text-4xl font-medium tracking-tight sm:text-5xl">Mural de Trabalhos</h1>
          <form key={busca} role="search" action="/mural" method="get" className="mt-6 max-w-2xl">
            <label htmlFor="busca" className="mb-2 block text-sm font-semibold">Buscar por título ou disciplina</label>
            <div className="flex gap-2">
              <input id="busca" name="q" type="search" defaultValue={busca} maxLength={120}
                placeholder="Nome do trabalho ou disciplina" className="min-h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3" />
              <button className={buttonVariants({ className: "min-h-11 px-4" })}><Search aria-hidden /> Buscar</button>
            </div>
            {explicito && <input type="hidden" name="ano" value={explicito} />}
            {serie && <input type="hidden" name="serie" value={serie} />}
            {turma && <input type="hidden" name="turma" value={turma} />}
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground">
            <p>{busca && !erro && `${projetos.length} ${projetos.length === 1 ? "resultado" : "resultados"} · `}{escolha || "Todos os anos"}</p>
            {busca && <Link href={href(explicito, serie, turma)} className="inline-flex min-h-11 items-center text-primary underline">Limpar busca</Link>}
            {busca && (ano || serie || turma) && <Link href={href(undefined, undefined, undefined, busca)} className="inline-flex min-h-11 items-center text-primary underline">Buscar em todo o mural</Link>}
          </div>
          <div className="mt-6">
            <details className="group mb-4 rounded-xl bg-card/70 p-3 shadow-sm ring-1 ring-primary/20 lg:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium">
                Filtrar por ano, série e turma
                <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden />
              </summary>
              <div className="mt-2">{menu}</div>
            </details>

            <section aria-label="Projetos">
              {!anos.length && !erro ? (
                <p className="py-12 text-center text-muted-foreground">Nenhum ano letivo cadastrado ainda.</p>
              ) : erro ? (
                <p className="py-12 text-center text-muted-foreground">
                  Não foi possível carregar o mural. Tente novamente em instantes.
                </p>
              ) : !projetos?.length ? (
                <p className="py-12 text-center text-muted-foreground">{busca ? "Nenhum trabalho encontrado. Tente outro título ou disciplina." : "Nenhum projeto publicado aqui ainda."}</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {projetos.map((p) => {
                    const autoria = textoAutoria(p.criado_por_nome, p.atualizado_por_nome);
                    const fotos = p.foto[0]?.count ?? 0;
                    const materiais = [
                      p.documento.length > 0 && "PDF",
                      p.link_slide && /^https?:\/\//i.test(p.link_slide) && "Slides",
                      fotos > 0 && `${fotos} ${fotos === 1 ? "foto" : "fotos"}`,
                    ].filter(Boolean).join(" · ");
                    return (
                      <li key={p.id}>
                        <LinkTrabalho id={p.id} origem={origem}
                          className="group block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        >
                          <Card className="flex h-full flex-col gap-0 overflow-hidden py-0 rounded-lg border border-black/5 bg-card shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md dark:border-white/10">
                            {/* Faixa superior: capa (se houver) ou a cor escolhida */}
                            <div
                              className="relative -mx-px -mt-px h-32 w-[calc(100%+2px)] shrink-0 overflow-hidden"
                              style={{ backgroundColor: p.cor }}
                            >
                              {p.capa && capaUrls.get(p.capa) && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={capaUrls.get(p.capa)} alt={`Capa do projeto ${p.titulo}`} className="h-full w-full object-cover motion-safe:transition-transform motion-safe:group-hover:scale-[1.025]" />
                              )}
                            </div>

                            {/* pt-4 dá uma distância inicial da faixa colorida */}
                            <CardHeader className="gap-1 px-3 pb-0 pt-5">
                              <CardDescription className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                <span>{p.turma.serie}º {p.turma.nome}</span>
                                <span className="size-1 rounded-full bg-black/15 dark:bg-white/20" aria-hidden />
                                <span>{p.semestre}º semestre</span>
                              </CardDescription>

                              {/* mt-2 afasta o título do subtítulo */}
                              <CardTitle className="mt-0.5 text-lg font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-primary dark:text-zinc-100">
                                <h2 className="line-clamp-2">{p.titulo}</h2>
                              </CardTitle>
                            </CardHeader>

                            {p.disciplina && (
                              // pt-1 mantém a badge bem próxima do título
                              <CardContent className="px-3 pb-2 pt-1.5">
                                <Badge
                                  variant="secondary"
                                  className="border border-black/5 bg-card px-1.5 py-0 text-[10px] font-medium text-zinc-600 transition-colors group-hover:bg-secondary group-hover:text-secondary-foreground dark:bg-white/5 dark:text-zinc-300"
                                >
                                  {p.disciplina}
                                </Badge>
                              </CardContent>
                            )}

                            {materiais && <p className="px-3 pb-2 pt-1 text-xs text-muted-foreground">{materiais}</p>}
                            {autoria && (
                              // mt-auto empurra o rodapé para baixo
                              <CardFooter className="mt-auto border-t border-black/5 bg-zinc-50/50 px-3 py-2 text-xs font-medium text-muted-foreground dark:bg-white/5">
                                <span className="line-clamp-1">{autoria}</span>
                              </CardFooter>
                            )}
                          </Card>
                        </LinkTrabalho>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
