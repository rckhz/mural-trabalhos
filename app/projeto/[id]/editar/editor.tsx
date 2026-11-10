"use client";

import { useState, type ReactNode } from "react";
import { Check, FileText, Images, Palette, Send, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { COR_PADRAO } from "@/components/seletor-cor";
import { Cabecalho } from "./cabecalho";

type Props = {
  projetoId: string;
  titulo: string;
  rotuloTurma: string;
  semestre: number;
  corSalva: string;
  capaSalvaUrl: string | null;
  temCapa: boolean;
  temPdf: boolean;
  temSlide: boolean;
  publicado: boolean;
  temDescricao: boolean;
  temFotos: boolean;
  sobre: ReactNode;
  documentos: ReactNode;
  fotos: ReactNode;
  situacao: ReactNode;
};

type Secao = "cabecalho" | "sobre" | "documento" | "fotos" | "situacao";

type Etapa = {
  id: Secao;
  rotulo: string;
  icone: typeof Palette;
  // Feita: aparece "Pronto" com ✓.
  feita: boolean;
  // Texto curto embaixo do nome: o que falta, ou o que é opcional.
  situacao: string;
};

export function EditorProjeto(props: Props) {
  const { projetoId, titulo, rotuloTurma, semestre, corSalva, capaSalvaUrl, temCapa } = props;
  const { temPdf, temSlide, publicado, temDescricao, temFotos } = props;
  const [secao, setSecao] = useState<Secao>("cabecalho");
  // Prévia ao vivo: a barra lateral mostra a cor e a capa antes de salvar.
  const [corViva, setCorViva] = useState(corSalva);
  const [capaViva, setCapaViva] = useState<string | null>(capaSalvaUrl);

  const docsOk = temPdf && temSlide;
  const faltaDocs = [!temPdf && "PDF", !temSlide && "link do slide"].filter(Boolean).join(" e ");
  const personalizado = temCapa || corSalva.toLowerCase() !== COR_PADRAO;

  const etapas: Etapa[] = [
    {
      id: "cabecalho",
      rotulo: "Cabeçalho",
      icone: Palette,
      feita: personalizado,
      situacao: "Opcional: escolha uma cor ou uma capa",
    },
    {
      id: "sobre",
      rotulo: "Sobre o projeto",
      icone: Type,
      feita: temDescricao,
      situacao: "Recomendado: escreva a descrição",
    },
    {
      id: "documento",
      rotulo: "PDF e slide",
      icone: FileText,
      feita: docsOk,
      situacao: docsOk ? "Pronto" : `Falta: ${faltaDocs}`,
    },
    {
      id: "fotos",
      rotulo: "Fotos",
      icone: Images,
      feita: temFotos,
      situacao: "Opcional: envie fotos do trabalho",
    },
    {
      id: "situacao",
      rotulo: "Publicar",
      icone: Send,
      feita: publicado,
      situacao: publicado
        ? "Publicado no mural"
        : docsOk
          ? "Pronto para publicar"
          : "Aguardando o PDF e o slide",
    },
  ];

  // Próximo passo obrigatório: documento primeiro, depois publicar.
  const proximo = publicado ? null : docsOk ? "situacao" : "documento";
  const avisoProximo = publicado
    ? "Projeto publicado. Você ainda pode trocar o PDF, o slide e as fotos."
    : docsOk
      ? "Tudo certo. Vá em Publicar para o projeto aparecer no mural."
      : `Falta enviar ${faltaDocs}. Vá em PDF e slide.`;

  const paineis: Record<Secao, ReactNode> = {
    cabecalho: (
      <Cabecalho
        projetoId={projetoId}
        corSalva={corSalva}
        temCapa={temCapa}
        capaSalvaUrl={capaSalvaUrl}
        onCor={setCorViva}
        onCapa={setCapaViva}
      />
    ),
    sobre: props.sobre,
    documento: props.documentos,
    fotos: props.fotos,
    situacao: props.situacao,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[19rem_1fr] lg:items-start">
      <aside className="grid gap-4 lg:sticky lg:top-6">
        <div className="overflow-hidden rounded-xl border border-black/10 bg-card shadow-sm">
          <div className="relative h-40 w-full" style={{ backgroundColor: corViva }}>
            {capaViva && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={capaViva} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="grid gap-1 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {rotuloTurma} · {semestre}º semestre
            </p>
            <h1 className="text-xl font-semibold leading-snug tracking-tight">{titulo}</h1>
          </div>
        </div>

        <div
          className={cn(
            "grid gap-1 rounded-xl border p-4 text-sm",
            publicado ? "border-[#128242]/30 bg-[#E2EBE5]/60" : "border-amber-300/60 bg-amber-50 dark:bg-amber-950/30",
          )}
        >
          <p className="font-semibold">{publicado ? "Situação: publicado" : "Próximo passo"}</p>
          <p className="text-muted-foreground">{avisoProximo}</p>
          {proximo && (
            <button
              type="button"
              onClick={() => setSecao(proximo)}
              className="mt-1 justify-self-start font-medium text-[#128242] underline underline-offset-4"
            >
              Ir para {proximo === "documento" ? "PDF e slide" : "Publicar"}
            </button>
          )}
        </div>

        <nav aria-label="Etapas do projeto" className="grid gap-1 rounded-xl border border-black/10 bg-card p-2 shadow-sm">
          {etapas.map((e, i) => {
            const ativa = e.id === secao;
            const Icone = e.icone;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => setSecao(e.id)}
                aria-current={ativa ? "step" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                  ativa ? "bg-[#C9E0D0] text-[#0A4A25]" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    e.feita ? "bg-[#128242] text-white" : "bg-black/5 text-muted-foreground",
                  )}
                >
                  {e.feita ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <Icone className="size-4 shrink-0" aria-hidden />
                <span className="grid min-w-0 flex-1">
                  <span className={cn("truncate", ativa && "font-semibold")}>{e.rotulo}</span>
                  <span className={cn("truncate text-xs", e.feita ? "font-medium text-[#128242]" : "text-muted-foreground")}>
                    {e.situacao}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="min-w-0">
        {(Object.keys(paineis) as Secao[]).map((id) => (
          <div key={id} hidden={id !== secao}>
            {paineis[id]}
          </div>
        ))}
      </section>
    </div>
  );
}
