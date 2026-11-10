import Link from "next/link";
import { ChevronDown, FolderOpen, LogIn } from "lucide-react";
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
function href(ano?: number, serie?: number, turma?: string) {
  const p = new URLSearchParams();
  if (ano) p.set("ano", String(ano));
  if (serie) p.set("serie", String(serie));
  if (turma) p.set("turma", turma);
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
      className={`group flex items-center justify-between gap-2 rounded-lg py-1.5 pr-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#128242]/50 ${recuo === 0
          ? "pl-2 text-[15px]" // Ano
          : recuo === 1
            ? "pl-2 text-[14px]" // Série
            : "pl-3 text-[14px]" // Turma
        } ${ativo
          ? "bg-[#C9E0D0] text-[#0A4A25] font-semibold dark:bg-[#128242]/35 dark:text-[#d4f5df]" // Fundo verde suave e texto escuro
          : caminhoAtivo
            ? "text-zinc-800 font-bold dark:text-zinc-100" // Itens "pais" abertos ficam destacados em negrito
            : "text-zinc-500 font-medium hover:bg-black/5 hover:text-zinc-700 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-zinc-100"
        }`}
    >
      <span className="truncate">{children}</span>

      <span
        className={`flex h-[22px] min-w-[24px] items-center justify-center rounded-md px-1.5 text-[11px] font-bold tabular-nums transition-colors ${ativo
            ? "bg-[#128242] text-white" // Badge verde sólido (ativo)
            : "bg-black/5 text-zinc-400 group-hover:bg-black/10 group-hover:text-zinc-600 dark:bg-white/10 dark:text-zinc-300 dark:group-hover:bg-white/20" // Badges inativos cinzentos
          }`}
      >
        {total}
      </span>
    </Link>
  );
}

// Árvore Ano › Série › Turma. Só o ano escolhido fica aberto.
function Menu({ anos, ano, serie, turma, contar }: {
  anos: number[]; ano?: number; serie?: number; turma?: string; contar: Contar;
}) {
  return (
    <nav aria-label="Filtrar projetos">
      <ul className="flex flex-col gap-1.5">
        {anos.map((a) => {
          const anoAberto = a === ano;
          return (
            <li key={a} className="flex flex-col gap-1">
              <Item para={href(a)} ativo={anoAberto && !serie} caminhoAtivo={anoAberto} total={contar(a)} recuo={0}>
                {a}
              </Item>

              {anoAberto && (
                <div className="ml-[15px] border-l-2 border-[#C9E0D0] pl-3 mt-1">
                  <ul className="flex flex-col gap-1">
                    {SERIES.map((s) => {
                      const serieAberta = s === serie;
                      return (
                        <li key={s} className="flex flex-col gap-1">
                          <Item para={href(a, s)} ativo={serieAberta && !turma} caminhoAtivo={serieAberta} total={contar(a, s)} recuo={1}>
                            {s}º ano
                          </Item>

                          {serieAberta && (
                            <div className="ml-[15px] border-l-2 border-[#C9E0D0] pl-3 mt-1 mb-1">
                              <ul className="flex flex-col gap-1">
                                {TURMAS.map((t) => (
                                  <li key={t}>
                                    <Item para={href(a, s, t)} ativo={serieAberta && t === turma} total={contar(a, s, t)} recuo={2}>
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

  const [{ data: anosDb }, { data: publicados }] = await Promise.all([
    supabase.from("ano_letivo").select("ano").order("ano", { ascending: false }),
    supabase.from("projeto").select("turma!inner(serie, nome, ano_letivo)").eq("status", "publicado"),
  ]);
  const anos = (anosDb ?? []).map((a) => a.ano as number);
  const turmasPub = (publicados ?? []).map((p) => p.turma as unknown as TurmaPub);
  const contar: Contar = (ano, serie, turma) =>
    turmasPub.filter(
      (t) => t.ano_letivo === ano && (!serie || t.serie === serie) && (!turma || t.nome === turma),
    ).length;

  // Sem ano na URL, abre o ano atual (ou o mais recente que já começou; se não houver, o primeiro da lista).
  const anoAtual = Number(new Intl.DateTimeFormat("en-CA", { year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date()));
  const padrao = anos.find((a) => a <= anoAtual) ?? anos.at(-1);
  const ano = anos.find((a) => String(a) === um(sp.ano)) ?? padrao;
  const serie = SERIES.find((s) => String(s) === um(sp.serie));
  const turma = TURMAS.find((t) => t === um(sp.turma));

  let projetos = null;
  let erro = false;
  if (ano) {
    let consulta = supabase
      .from("projeto")
      .select("id, titulo, disciplina, semestre, cor, capa, criado_em, criado_por_nome, atualizado_por_nome, turma!inner(serie, nome, ano_letivo)")
      .eq("status", "publicado")
      .eq("turma.ano_letivo", ano);
    if (serie) consulta = consulta.eq("turma.serie", serie);
    if (turma) consulta = consulta.eq("turma.nome", turma);
    const r = await consulta;
    erro = Boolean(r.error);
    projetos = (r.data ?? [])
      .map((p) => ({ ...p, turma: p.turma as unknown as TurmaPub }))
      .sort(
        (a, b) =>
          a.turma.serie - b.turma.serie ||
          a.turma.nome.localeCompare(b.turma.nome) ||
          a.semestre - b.semestre ||
          b.criado_em.localeCompare(a.criado_em),
      );
  }

  // Capas são de bucket privado: um link temporário (1 h) para cada projeto que tem capa.
  const caminhosCapa = (projetos ?? []).flatMap((p) => (p.capa ? [p.capa] : []));
  const capaUrls = new Map<string, string>();
  if (caminhosCapa.length) {
    const { data: links } = await supabase.storage.from("capas").createSignedUrls(caminhosCapa, 3600);
    for (const l of links ?? []) if (l.path && l.signedUrl) capaUrls.set(l.path, l.signedUrl);
  }

  const escolha = ano ?[String(ano), serie && `${serie}º ano`, turma].filter(Boolean).join(" · ") : "";
  const menu = <Menu anos={anos} ano={ano} serie={serie} turma={turma} contar={contar} />;

  return (
    <div className="lg:flex">
      {/* Aplique este bloco no seu componente principal (Mural) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r border-black/10 bg-[#E8E5D8] dark:bg-[#18221c] lg:flex">
        {/* Cabeçalho */}
        <div className="flex h-16 items-center border-b border-black/10 px-5">
          <p className="flex items-center gap-2.5 text-[15px] font-bold text-[#0A4A25] dark:text-zinc-100">
            <FolderOpen className="size-[18px] text-[#128242]" strokeWidth={2.5} aria-hidden />
            Projetos ETEC
          </p>
        </div>

        {/* Área de Navegação */}
        <div className="flex-1 px-3 py-5">
          {menu}
        </div>
      </aside>

      <main className="relative min-w-0 flex-1 px-4 py-6 pb-16 lg:px-8">
        <div className="max-w-5xl">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">Mural de Trabalhos</h1>
            <p className="text-sm text-muted-foreground">ETEC Dra. Ruth Cardoso</p>
          </div>
          <Link
            href="/entrar"
            className={`absolute top-4 right-8 sm:top-6 lg:right-12${buttonVariants({ variant: "outline", size: "sm" })}`}
          >
            <LogIn />Entrar
          </Link>
          {escolha && <p className="mt-3 text-sm font-medium">{escolha}</p>}

          <div className="mt-6">
            <details className="group mb-4 rounded-xl bg-card/70 p-3 shadow-sm ring-1 ring-primary/20 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                Filtrar por ano, série e turma
                <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden />
              </summary>
              <div className="mt-2">{menu}</div>
            </details>

            <section aria-label="Projetos">
              {!ano ? (
                <p className="py-12 text-center text-muted-foreground">Nenhum ano letivo cadastrado ainda.</p>
              ) : erro ? (
                <p className="py-12 text-center text-muted-foreground">
                  Não foi possível carregar o mural. Tente novamente em instantes.
                </p>
              ) : !projetos?.length ? (
                <p className="py-12 text-center text-muted-foreground">Nenhum projeto publicado aqui ainda.</p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {projetos.map((p) => {
                    const autoria = textoAutoria(p.criado_por_nome, p.atualizado_por_nome);
                    return (
                      <li key={p.id}>
                        <Link
                          href={`/projeto/${p.id}`}
                          className="group block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#128242]/50"
                        >
                          <Card className="flex h-full flex-col gap-0 overflow-hidden py-0 rounded-lg border border-black/5 bg-[#F1EEE3] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#128242]/30 hover:shadow-md dark:border-white/10 dark:bg-[#26322b]">
                            {/* Faixa superior: capa (se houver) ou a cor escolhida */}
                            <div
                              className="relative -mx-px -mt-px h-20 w-[calc(100%+2px)] shrink-0 overflow-hidden"
                              style={{ backgroundColor: p.cor }}
                            >
                              {p.capa && capaUrls.get(p.capa) && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={capaUrls.get(p.capa)} alt={`Capa do projeto ${p.titulo}`} className="h-full w-full object-cover" />
                              )}
                            </div>

                            {/* pt-4 dá uma distância inicial da faixa colorida */}
                            <CardHeader className="gap-1 px-3 pb-0 pt-5">
                              <CardDescription className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#128242]/80">
                                <span>{p.turma.serie}º {p.turma.nome}</span>
                                <span className="size-1 rounded-full bg-black/15 dark:bg-white/20" aria-hidden />
                                <span>{p.semestre}º semestre</span>
                              </CardDescription>

                              {/* mt-2 afasta o título do subtítulo */}
                              <CardTitle className="mt-0.5 text-[15px] font-bold leading-snug text-zinc-900 transition-colors group-hover:text-[#128242] dark:text-zinc-100">
                                <h2 className="line-clamp-2">{p.titulo}</h2>
                              </CardTitle>
                            </CardHeader>

                            {p.disciplina && (
                              // pt-1 mantém a badge bem próxima do título
                              <CardContent className="px-3 pb-2 pt-1.5">
                                <Badge
                                  variant="secondary"
                                  className="border border-black/5 bg-[#F9F8F5] px-1.5 py-0 text-[10px] font-medium text-zinc-600 transition-colors group-hover:bg-[#E2EBE5] group-hover:text-[#0A4A25] dark:bg-white/5 dark:text-zinc-300"
                                >
                                  {p.disciplina}
                                </Badge>
                              </CardContent>
                            )}

                            {autoria && (
                              // mt-auto empurra o rodapé para baixo
                              <CardFooter className="mt-auto border-t border-black/5 bg-zinc-50/50 px-3 py-1.5 text-[10px] font-medium text-zinc-500 dark:bg-white/5">
                                <span className="line-clamp-1">{autoria}</span>
                              </CardFooter>
                            )}
                          </Card>
                        </Link>
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
