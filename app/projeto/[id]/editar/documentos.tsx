"use client";

import { useRef, useState, useTransition } from "react";
import { Check, ExternalLink, FileText, Link2, Presentation, Trash2, Upload } from "lucide-react";
import { useConfirmar } from "@/components/confirmar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { removerDocumento, salvarDocumento, salvarLinkSlide } from "@/lib/acoes-projeto";
import { supabaseNavegador } from "@/lib/supabase/navegador";

const LIMITE_PDF = 5 * 1024 * 1024;

type Mensagem = { texto: string; erro?: boolean } | null;

function Aviso({ mensagem }: { mensagem: Mensagem }) {
  if (!mensagem) return null;
  return (
    <p role={mensagem.erro ? "alert" : "status"} className={`text-sm ${mensagem.erro ? "text-destructive" : "text-muted-foreground"}`}>
      {mensagem.texto}
    </p>
  );
}

export function Documentos({
  projetoId,
  pdf,
  linkSlide,
}: {
  projetoId: string;
  pdf: { url: string | null; enviadoEm: string | null };
  linkSlide: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg"><h2>Documento e slide</h2></CardTitle>
        <CardDescription>Os 2 são obrigatórios para publicar no mural.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <CaixaPdf projetoId={projetoId} {...pdf} />
        {/* key: quando o link salvo muda (já normalizado pelo servidor), o campo recomeça com ele. */}
        <CaixaLink key={linkSlide ?? ""} projetoId={projetoId} link={linkSlide} />
      </CardContent>
    </Card>
  );
}

function CaixaPdf({ projetoId, url, enviadoEm }: { projetoId: string; url: string | null; enviadoEm: string | null }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [mensagem, setMensagem] = useState<Mensagem>(null);
  const [ocupado, setOcupado] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [dialogo, confirmar] = useConfirmar();

  const enviar = async (arquivo: File) => {
    if (!arquivo.name.toLowerCase().endsWith(".pdf")) return setMensagem({ texto: "Envie um arquivo PDF.", erro: true });
    if (arquivo.size > LIMITE_PDF) {
      return setMensagem({ texto: "O PDF passa de 5 MB. Diminua o arquivo e tente de novo.", erro: true });
    }
    setOcupado(true);
    setMensagem({ texto: "Enviando..." });
    const supabase = supabaseNavegador();
    const caminho = `${projetoId}/doc-${Date.now()}.pdf`;
    const { error } = await supabase.storage
      .from("documentos")
      .upload(caminho, arquivo, { contentType: "application/pdf" });
    if (error) {
      setOcupado(false);
      return setMensagem({ texto: "Falha no envio. Verifique a internet e tente de novo.", erro: true });
    }
    const r = await salvarDocumento(projetoId, caminho);
    if (r.erro) {
      await supabase.storage.from("documentos").remove([caminho]); // não deixa arquivo solto
      setMensagem({ texto: r.erro, erro: true });
    } else {
      setMensagem({ texto: "Documento enviado!" });
    }
    setOcupado(false);
  };

  const remover = async () => {
    const ok = await confirmar({
      titulo: "Remover o documento?",
      texto: "O arquivo será apagado. Você pode enviar outro depois.",
      acao: "Remover",
      perigoso: true,
    });
    if (!ok) return;
    setOcupado(true);
    const r = await removerDocumento(projetoId);
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
        <FileText className="size-8 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0">
          <p className="font-medium">Documento (PDF)</p>
          <p className="text-sm text-muted-foreground">Aparece na tela do mural · até 5 MB</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {enviadoEm ? `Enviado em ${enviadoEm}` : "Nenhum arquivo ainda"}
          </p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <input
          ref={entrada}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            e.target.value = "";
            if (arquivo) enviar(arquivo);
          }}
        />
        <Button size="sm" variant={url ? "outline" : "default"} disabled={ocupado} onClick={() => entrada.current?.click()}>
          <Upload />
          {url ? "Substituir" : "Enviar documento"}
        </Button>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ExternalLink />Abrir
          </a>
        )}
        {url && (
          <Button size="icon-sm" variant="ghost" disabled={ocupado} onClick={remover} aria-label="Remover documento">
            <Trash2 />
          </Button>
        )}
      </div>
      <Aviso mensagem={mensagem} />
    </div>
  );
}

function CaixaLink({ projetoId, link }: { projetoId: string; link: string | null }) {
  const [valor, setValor] = useState(link ?? "");
  const [mensagem, setMensagem] = useState<Mensagem>(null);
  const [pendente, iniciar] = useTransition();
  const mudou = valor.trim() !== (link ?? "");

  const salvar = () =>
    iniciar(async () => {
      const r = await salvarLinkSlide(projetoId, valor);
      setMensagem(r.erro ? { texto: r.erro, erro: true } : { texto: valor.trim() ? "Link salvo!" : "Link removido." });
    });

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-4"
      onSubmit={(e) => {
        e.preventDefault();
        salvar();
      }}
    >
      <div className="flex items-start gap-3">
        <Presentation className="size-8 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0">
          <p className="font-medium">Slide (link)</p>
          <p className="text-sm text-muted-foreground">
            Google Apresentações, Canva, OneDrive... Deixe o slide compartilhado como &quot;qualquer pessoa com o link&quot;.
          </p>
        </div>
      </div>
      <div className="mt-auto grid gap-2">
        <label htmlFor="link_slide" className="sr-only">Link do slide</label>
        <Input
          id="link_slide"
          type="text"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="https://docs.google.com/presentation/..."
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            setMensagem(null);
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" variant={link && !mudou ? "outline" : "default"} disabled={pendente || !mudou}>
            {link && !mudou ? <><Check />Salvo</> : <><Link2 />{pendente ? "Salvando..." : "Salvar link"}</>}
          </Button>
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <ExternalLink />Abrir
            </a>
          )}
        </div>
      </div>
      <Aviso mensagem={mensagem} />
    </form>
  );
}
