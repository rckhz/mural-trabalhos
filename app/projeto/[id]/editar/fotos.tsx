"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useConfirmar } from "@/components/confirmar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adicionarFoto, removerFoto } from "@/lib/acoes-projeto";
import { comprimirFoto } from "@/lib/imagem";
import { supabaseNavegador } from "@/lib/supabase/navegador";

export function Fotos({ projetoId, fotos }: { projetoId: string; fotos: { id: string; url: string | null }[] }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [mensagem, setMensagem] = useState<{ texto: string; erro?: boolean } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [dialogo, confirmar] = useConfirmar();

  const enviar = async (arquivos: File[]) => {
    setOcupado(true);
    const supabase = supabaseNavegador();
    const falhas: string[] = [];
    let enviadas = 0;
    for (const [i, arquivo] of arquivos.entries()) {
      setMensagem({ texto: `Enviando foto ${i + 1} de ${arquivos.length}...` });
      // Cada etapa tem a sua mensagem, para saber exatamente onde falhou.
      let etapa = "ler a foto";
      try {
        if (/\.(heic|heif)$/i.test(arquivo.name) || /hei[cf]/i.test(arquivo.type)) {
          throw new Error("foto no formato HEIC (iPhone), que o navegador não abre. Envie em JPG ou PNG");
        }
        if (arquivo.type && !arquivo.type.startsWith("image/")) throw new Error("o arquivo não é uma imagem");
        etapa = "reduzir a foto";
        const { blob, extensao } = await comprimirFoto(arquivo);
        etapa = "enviar ao armazenamento";
        const caminho = `${projetoId}/${crypto.randomUUID()}.${extensao}`;
        const { error } = await supabase.storage.from("fotos").upload(caminho, blob, { contentType: blob.type });
        if (error) throw error;
        etapa = "salvar no projeto";
        const r = await adicionarFoto(projetoId, caminho);
        if (r.erro) {
          await supabase.storage.from("fotos").remove([caminho]);
          throw new Error(r.erro);
        }
        enviadas++;
      } catch (e) {
        const motivo = e instanceof Error ? e.message : String(e);
        console.error(`Foto "${arquivo.name}" falhou ao ${etapa}:`, e);
        falhas.push(`${arquivo.name} (ao ${etapa}: ${motivo})`);
      }
    }
    setMensagem(
      falhas.length
        ? { texto: `${enviadas} enviada(s). Não foi possível enviar: ${falhas.join("; ")}`, erro: true }
        : { texto: `${enviadas} foto(s) enviada(s)!` },
    );
    setOcupado(false);
  };

  const remover = async (id: string) => {
    const ok = await confirmar({ titulo: "Remover esta foto?", texto: "A foto será apagada.", acao: "Remover", perigoso: true });
    if (!ok) return;
    setOcupado(true);
    const r = await removerFoto(id);
    setMensagem(r.erro ? { texto: r.erro, erro: true } : null);
    setOcupado(false);
  };

  return (
    <Card>
      {dialogo}
      <CardHeader>
        <CardTitle className="text-lg"><h2>Fotos</h2></CardTitle>
        <CardDescription>As fotos são reduzidas automaticamente antes de enviar, para economizar espaço.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {fotos.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {fotos.map((f) => (
              <li key={f.id} className="relative">
                {f.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt="Foto do trabalho" className="aspect-4/3 w-full rounded-lg object-cover" />
                )}
                <Button
                  size="icon-sm"
                  variant="secondary"
                  className="absolute top-1.5 right-1.5 shadow"
                  disabled={ocupado}
                  onClick={() => remover(f.id)}
                  aria-label="Remover foto"
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={entrada}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const arquivos = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (arquivos.length) enviar(arquivos);
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" disabled={ocupado} onClick={() => entrada.current?.click()}>
            <ImagePlus />
            Adicionar fotos
          </Button>
          {mensagem && (
            <span role={mensagem.erro ? "alert" : "status"} className={`text-sm ${mensagem.erro ? "text-destructive" : "text-muted-foreground"}`}>
              {mensagem.texto}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
