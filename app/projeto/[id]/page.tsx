import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowLeft, ExternalLink, FileText, Images, Pencil, Presentation } from "lucide-react";
import { podeEditar } from "@/lib/projetos";
import { sessaoAtual } from "@/lib/sessao";
import { supabaseServidor } from "@/lib/supabase/servidor";
import styles from "./projeto.module.css";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UMA_HORA = 3600;

// O banco já só aceita http(s), mas confere de novo antes de virar link na página.
const linkSeguro = (link: string | null) => (link && /^https?:\/\//i.test(link) ? link : null);
const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

export default async function Projeto({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mural?: string | string[] }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await supabaseServidor();

  // O RLS decide: visitante só enxerga projeto/documentos publicados;
  // aluno da sala e professora também veem rascunhos.
  const { data: projeto } = await supabase
    .from("projeto")
    .select(
      "id, titulo, descricao, disciplina, semestre, link_slide, status, cor, capa, turma_id, criado_em, atualizado_em, criado_por_nome, atualizado_por_nome, turma(serie, nome, ano_letivo)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!projeto) notFound();

  const t = projeto.turma as unknown as { serie: number; nome: string; ano_letivo: number };
  const { mural } = await searchParams;
  let retorno = `/mural?ano=${t.ano_letivo}&serie=${t.serie}&turma=${encodeURIComponent(t.nome)}`;
  if (typeof mural === "string" && (mural === "/mural" || mural.startsWith("/mural?"))) {
    const filtros = new URLSearchParams(mural.split("?").slice(1).join("?"));
    const permitidos = new URLSearchParams();
    for (const campo of ["ano", "serie", "turma", "q"]) {
      const valor = filtros.get(campo);
      if (valor) permitidos.set(campo, valor);
    }
    retorno = `/mural${permitidos.size ? "?" + permitidos : ""}#trabalho-${id}`;
  }
  const s = await sessaoAtual();
  const editavel = s ? podeEditar(s.perfil, projeto) : false;

  const [{ data: doc }, { data: fotos }] = await Promise.all([
    supabase.from("documento").select("arquivo, status").eq("projeto_id", id).maybeSingle(),
    supabase.from("foto").select("id, arquivo, legenda").eq("projeto_id", id).order("atualizado_em"),
  ]);

  const slide = linkSeguro(projeto.link_slide);
  const [{ data: urlDoc }, { data: urlsFotos }, { data: urlCapa }] = await Promise.all([
    doc
      ? supabase.storage.from("documentos").createSignedUrl(doc.arquivo, UMA_HORA)
      : Promise.resolve({ data: null }),
    fotos?.length
      ? supabase.storage.from("fotos").createSignedUrls(fotos.map((f) => f.arquivo), UMA_HORA)
      : Promise.resolve({ data: [] as { signedUrl: string | null }[] }),
    projeto.capa
      ? supabase.storage.from("capas").createSignedUrl(projeto.capa, UMA_HORA)
      : Promise.resolve({ data: null }),
  ]);

  const galeria = (fotos ?? []).flatMap((foto, i) => {
    const url = urlsFotos?.[i]?.signedUrl;
    return url ? [{ ...foto, url }] : [];
  });

  return (
    <main className={styles.page}>
      <nav aria-label="Navegação do trabalho" className={styles.nav}>
        <Link href={retorno} className={styles.back}>
          <ArrowLeft size={17} aria-hidden /> Voltar ao mural
        </Link>
        {editavel && (
          <Link href={`/projeto/${id}/editar`} className={buttonVariants({ variant: "outline", className: "min-h-11 px-4" })}>
            <Pencil /> Editar trabalho
          </Link>
        )}
      </nav>

      <article>
        <header className={styles.hero}>
          <div className={styles.heading}>
            <p className={styles.kicker}>{t.ano_letivo} · {projeto.semestre}º semestre</p>
            <h1>{projeto.titulo}</h1>
            <div className={styles.tags}>
              <span>{t.serie}º {t.nome}</span>
              {projeto.disciplina && <span>{projeto.disciplina}</span>}
              {projeto.status !== "publicado" && <Badge variant="outline">{projeto.status}</Badge>}
            </div>
            {(slide || urlDoc?.signedUrl || galeria.length > 0) && (
              <nav className={styles.actions} aria-label="Materiais do trabalho">
                {urlDoc?.signedUrl && <a className={styles.action} href="#documento"><FileText /> Ler documento <ArrowDown /></a>}
                {slide && <a className={styles.action} href={slide} target="_blank" rel="noopener noreferrer"><Presentation /> Abrir slides <ExternalLink /></a>}
                {galeria.length > 0 && <a className={styles.action} href="#fotos"><Images /> Ver fotos <ArrowDown /></a>}
              </nav>
            )}
          </div>
          {urlCapa?.signedUrl ? (
            <div className={styles.cover}>
              <img src={urlCapa.signedUrl} alt="" />
            </div>
          ) : (
            <div className={styles.index} aria-hidden="true">
              <div className={styles.sheet} style={{ borderLeftColor: projeto.cor }}>
                <span>ETEC Dra. Ruth Cardoso</span>
                <strong>{t.serie}º {t.nome}</strong>
                <span>{t.ano_letivo}</span>
              </div>
            </div>
          )}
        </header>

        {projeto.descricao && (
          <section className={styles.section} aria-labelledby="sobre">
            <h2 id="sobre">Sobre o trabalho</h2>
            <p className={styles.description}>{projeto.descricao}</p>
          </section>
        )}

        <section id="documento" className={styles.section} aria-labelledby="titulo-doc">
          <div>
            <h2 id="titulo-doc">Documento</h2>
            {doc && doc.status !== "publicado" && <Badge variant="outline">{doc.status}</Badge>}
          </div>
          {urlDoc?.signedUrl ? (
            <div className={styles.reader}>
              <a href={urlDoc.signedUrl} target="_blank" rel="noopener noreferrer">
                Abrir em nova aba <ExternalLink size={16} aria-hidden />
              </a>
              <iframe src={urlDoc.signedUrl} title={`Documento de ${projeto.titulo}`} loading="lazy" />
            </div>
          ) : (
            <p className={styles.empty}><FileText size={19} aria-hidden />
              {doc ? "Não foi possível abrir o documento." : "Nenhum documento enviado ainda."}
            </p>
          )}
        </section>

        {galeria.length > 0 && (
          <section id="fotos" className={styles.section} aria-labelledby="titulo-fotos">
            <h2 id="titulo-fotos">Fotos do trabalho</h2>
            <ul className={styles.gallery}>
              {galeria.map((foto, i) => (
                <li key={foto.id}>
                  <figure>
                    <a href={foto.url} target="_blank" rel="noopener noreferrer">
                      <img src={foto.url} alt={foto.legenda || `Foto ${i + 1} do trabalho`} loading="lazy" />
                    </a>
                    {foto.legenda && <figcaption>{foto.legenda}</figcaption>}
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(projeto.criado_por_nome || projeto.atualizado_por_nome) && (
          <footer className={styles.byline}>
            {projeto.criado_por_nome && <p>Criado por {projeto.criado_por_nome} em {data(projeto.criado_em)}</p>}
            {projeto.atualizado_por_nome && <p>Última edição por {projeto.atualizado_por_nome} em {data(projeto.atualizado_em)}</p>}
          </footer>
        )}
      </article>
    </main>
  );
}
