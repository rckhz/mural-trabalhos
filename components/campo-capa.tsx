"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Escolhe uma imagem para a capa e mostra a prévia. Quem usa decide o que fazer com o arquivo.
export function CampoCapa({
  urlAtual,
  onArquivo,
  onTirar,
  altura = "h-40",
}: {
  urlAtual?: string | null;
  onArquivo: (arquivo: File | null) => void;
  // Chamado quando a pessoa tira a capa que já estava salva.
  onTirar?: () => void;
  altura?: string;
}) {
  const [previa, setPrevia] = useState<string | null>(null);
  const [tirada, setTirada] = useState(false);

  useEffect(() => {
    if (!previa) return;
    return () => URL.revokeObjectURL(previa);
  }, [previa]);

  function escolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setPrevia(URL.createObjectURL(arquivo));
    setTirada(false);
    onArquivo(arquivo);
    e.target.value = "";
  }

  function tirar() {
    setPrevia(null);
    setTirada(true);
    onArquivo(null);
    onTirar?.();
  }

  const imagem = previa ?? (tirada ? null : urlAtual ?? null);

  if (imagem) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-black/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagem} alt="Capa do projeto" className={`${altura} w-full object-cover`} />
        <div className="absolute top-2 right-2 flex gap-2">
          <label className="inline-flex h-7 cursor-pointer items-center rounded-md bg-background/90 px-2.5 text-xs font-medium shadow-sm hover:bg-background">
            Trocar
            <input type="file" accept="image/*" className="sr-only" onChange={escolher} />
          </label>
          <Button type="button" variant="secondary" size="icon-sm" onClick={tirar} aria-label="Tirar a capa">
            <X />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <label
      className={`flex ${altura} cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-black/20 text-sm text-muted-foreground transition hover:bg-accent/40`}
    >
      <ImagePlus className="size-6" aria-hidden />
      Adicionar imagem de capa
      <input type="file" accept="image/*" className="sr-only" onChange={escolher} />
    </label>
  );
}
