"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { useConfirmar } from "@/components/confirmar";
import { Button } from "@/components/ui/button";
import { limparSoltos } from "./acoes";

export function LimparSoltos({ quantidade, tamanho }: { quantidade: number; tamanho: string }) {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const [dialogo, confirmar] = useConfirmar();

  const limpar = async () => {
    const ok = await confirmar({
      titulo: "Apagar os arquivos soltos?",
      texto: `São ${quantidade} arquivo(s), ${tamanho}, que nenhum projeto usa mais. Os projetos não são afetados.`,
      acao: "Apagar",
    });
    if (!ok) return;
    iniciar(async () => {
      const r = await limparSoltos();
      setMensagem(r.erro ?? `${r.apagados} arquivo(s) apagado(s).`);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {dialogo}
      <Button size="sm" variant="outline" disabled={pendente} onClick={limpar}>
        <Sparkles />{pendente ? "Limpando..." : "Limpar"}
      </Button>
      {mensagem && <span role="status" className="text-sm text-muted-foreground">{mensagem}</span>}
    </div>
  );
}
