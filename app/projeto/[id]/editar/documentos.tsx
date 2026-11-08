"use client";

import { useRef, useState } from "react";
import { Download, ExternalLink, FileText, Presentation, Trash2, Upload } from "lucide-react";
import { useConfirmar } from "@/components/confirmar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { removerDocumento, salvarDocumento, type FormatoDocumento } from "@/lib/acoes-projeto";
import { supabaseNavegador } from "@/lib/supabase/navegador";

const MB = 1024 * 1024;

// Tipo de cada extensão aceita (o navegador às vezes não informa o tipo do .pptx).
const TIPOS: Record<string, string> = {
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  odp: "application/vnd.oasis.opendocument.presentation",
};

const CONFIG = {
  pdf: {
    titulo: "Documento (PDF)",
    dica: "Aparece na tela do mural",
    extensoes: ["pdf"],
    limiteMb: 5,
    botao: "Enviar documento",
    icone: FileText,
  },
  slide: {
    titulo: "Slide (PowerPoint)",
    dica: "Arquivo .pptx, .ppt ou .odp, para baixar",
    extensoes: ["pptx", "ppt", "odp"],
    limiteMb: 10,
    botao: "Enviar slide",
    icone: Presentation,
  },
} as const;

export type ItemDocumento = { url: string | null; enviadoEm: string | null };

export function Documentos({
  projetoId,
  bimestre,
  pdf,
  slide,
}: {
  projetoId: string;
  bimestre: number;
  pdf: ItemDocumento;
  slide: ItemDocumento;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg"><h2>Arquivos do trabalho</h2></CardTitle>
        <CardDescription>
          Os 2 são obrigatórios para publicar no mural. Enviar de novo substitui o arquivo anterior.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Caixa projetoId={projetoId} bimestre={bimestre} formato="pdf" {...pdf} />
        <Caixa projetoId={projetoId} bimestre={bimestre} formato="slide" {...slide} />
      </CardContent>
    </Card>
  );
}

function Caixa({
  projetoId,
  bimestre,
  formato,
  url,
  enviadoEm,
}: ItemDocumento & { projetoId: string; bimestre: number; formato: FormatoDocumento }) {
  const c = CONFIG[formato];
  const Icone = c.icone;
  const entrada = useRef<HTMLInputElement>(null);
  const [mensagem, setMensagem] = useState<{ texto: string; erro?: boolean } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [dialogo, confirmar] = useConfirmar();

  const enviar = async (arquivo: File) => {
    const ext = arquivo.name.split(".").pop()?.toLowerCase() ?? "";
    if (!(c.extensoes as readonly string[]).includes(ext)) {
      return setMensagem({ texto: `Envie um arquivo ${c.extensoes.map((e) => "." + e).join(", ")}.`, erro: true });
    }
    if (arquivo.size > c.limiteMb * MB) {
      return setMensagem({
        texto:
          formato === "slide"
            ? `O slide passa de ${c.limiteMb} MB. No PowerPoint, use Arquivo › Compactar imagens e tente de novo.`
            : `O PDF passa de ${c.limiteMb} MB. Diminua o arquivo e tente de novo.`,
        erro: true,
      });
    }
    setOcupado(true);
    setMensagem({ texto: "Enviando..." });
    const supabase = supabaseNavegador();
    const caminho = `${projetoId}/b${bimestre}-${formato}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("documentos")
      .upload(caminho, arquivo, { contentType: TIPOS[ext] });
    if (error) {
      setOcupado(false);
      return setMensagem({ texto: "Falha no envio. Verifique a internet e tente de novo.", erro: true });
    }
    const r = await salvarDocumento(projetoId, bimestre, caminho, formato);
    if (r.erro) {
      await supabase.storage.from("documentos").remove([caminho]); // não deixa arquivo solto
      setMensagem({ texto: r.erro, erro: true });
    } else {
      setMensagem({ texto: "Arquivo enviado!" });
    }
    setOcupado(false);
  };

  const remover = async () => {
    const ok = await confirmar({
      titulo: `Remover o ${formato === "pdf" ? "documento" : "slide"}?`,
      texto: "O arquivo será apagado. Você pode enviar outro depois.",
      acao: "Remover",
      perigoso: true,
    });
    if (!ok) return;
    setOcupado(true);
    const r = await removerDocumento(projetoId, bimestre, formato);
    setMensagem(r.erro ? { texto: r.erro, erro: true } : null);
    setOcupado(false);
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border-2 border-dashed p-4 transition ${arrastando ? "border-primary bg-muted/50" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setArrastando(true);
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastando(false);
        const arquivo = e.dataTransfer.files?.[0];
        if (arquivo && !ocupado) enviar(arquivo);
      }}
    >
      {dialogo}
      <div className="flex items-start gap-3">
        <Icone className="size-8 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0">
          <p className="font-medium">{c.titulo}</p>
          <p className="text-sm text-muted-foreground">{c.dica} · até {c.limiteMb} MB</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {enviadoEm ? `Enviado em ${enviadoEm}` : "Nenhum arquivo ainda"}
          </p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <input
          ref={entrada}
          type="file"
          accept={c.extensoes.map((e) => "." + e).join(",")}
          className="hidden"
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            e.target.value = "";
            if (arquivo) enviar(arquivo);
          }}
        />
        <Button size="sm" variant={url ? "outline" : "default"} disabled={ocupado} onClick={() => entrada.current?.click()}>
          <Upload />
          {url ? "Substituir" : c.botao}
        </Button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {formato === "pdf" ? <><ExternalLink />Abrir</> : <><Download />Baixar</>}
          </a>
        )}
        {url && (
          <Button size="icon-sm" variant="ghost" disabled={ocupado} onClick={remover} aria-label={`Remover ${c.titulo}`}>
            <Trash2 />
          </Button>
        )}
      </div>
      {mensagem && (
        <p role={mensagem.erro ? "alert" : "status"} className={`text-sm ${mensagem.erro ? "text-destructive" : "text-muted-foreground"}`}>
          {mensagem.texto}
        </p>
      )}
    </div>
  );
}
