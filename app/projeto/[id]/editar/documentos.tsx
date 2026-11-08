"use client";

import { useRef, useState } from "react";
import { ExternalLink, Trash2, Upload } from "lucide-react";
import { useConfirmar } from "@/components/confirmar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { removerDocumento, salvarDocumento } from "@/lib/acoes-projeto";
import { supabaseNavegador } from "@/lib/supabase/navegador";

const LIMITE_PDF = 5 * 1024 * 1024;

type Item = { bimestre: number; url: string | null; enviadoEm: string | null };

export function Documentos({ projetoId, itens }: { projetoId: string; itens: Item[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg"><h2>Documentos</h2></CardTitle>
        <CardDescription>Um PDF por bimestre, de até 5 MB. Enviar de novo substitui o arquivo anterior.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {itens.map((i) => <SlotDocumento key={i.bimestre} projetoId={projetoId} {...i} />)}
      </CardContent>
    </Card>
  );
}

function SlotDocumento({ projetoId, bimestre, url, enviadoEm }: Item & { projetoId: string }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [mensagem, setMensagem] = useState<{ texto: string; erro?: boolean } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [dialogo, confirmar] = useConfirmar();

  const enviar = async (arquivo: File) => {
    if (arquivo.type !== "application/pdf") return setMensagem({ texto: "Envie um arquivo PDF.", erro: true });
    if (arquivo.size > LIMITE_PDF) {
      return setMensagem({ texto: "O PDF passa de 5 MB. Diminua o arquivo e tente de novo.", erro: true });
    }
    setOcupado(true);
    setMensagem({ texto: "Enviando..." });
    const supabase = supabaseNavegador();
    const caminho = `${projetoId}/b${bimestre}-${Date.now()}.pdf`;
    const { error } = await supabase.storage
      .from("documentos")
      .upload(caminho, arquivo, { contentType: "application/pdf" });
    if (error) {
      setOcupado(false);
      return setMensagem({ texto: "Falha no envio. Verifique a internet e tente de novo.", erro: true });
    }
    const r = await salvarDocumento(projetoId, bimestre, caminho);
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
      titulo: `Remover o documento do ${bimestre}º bimestre?`,
      texto: "O arquivo será apagado. Você pode enviar outro depois.",
      acao: "Remover",
      perigoso: true,
    });
    if (!ok) return;
    setOcupado(true);
    const r = await removerDocumento(projetoId, bimestre);
    setMensagem(r.erro ? { texto: r.erro, erro: true } : null);
    setOcupado(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
      {dialogo}
      <div>
        <p className="font-medium">{bimestre}º bimestre</p>
        <p className="text-sm text-muted-foreground">{enviadoEm ? `Enviado em ${enviadoEm}` : "Nenhum documento ainda"}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ExternalLink />Abrir
          </a>
        )}
        <input
          ref={entrada}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            e.target.value = "";
            if (arquivo) enviar(arquivo);
          }}
        />
        <Button size="sm" variant={url ? "outline" : "default"} disabled={ocupado} onClick={() => entrada.current?.click()}>
          <Upload />
          {url ? "Substituir" : "Enviar PDF"}
        </Button>
        {url && (
          <Button size="icon-sm" variant="ghost" disabled={ocupado} onClick={remover} aria-label={`Remover documento do ${bimestre}º bimestre`}>
            <Trash2 />
          </Button>
        )}
      </div>
      {mensagem && (
        <p role={mensagem.erro ? "alert" : "status"} className={`w-full text-sm ${mensagem.erro ? "text-destructive" : "text-muted-foreground"}`}>
          {mensagem.texto}
        </p>
      )}
    </div>
  );
}
