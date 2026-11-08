"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useConfirmar } from "@/components/confirmar";
import { Button } from "@/components/ui/button";
import { removerConta } from "./acoes";

export function BotaoRemover({ id, nome }: { id: string; nome: string }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const [dialogo, confirmar] = useConfirmar();

  const remover = async () => {
    const ok = await confirmar({
      titulo: `Remover a conta de ${nome}?`,
      texto:
        "O login e o perfil serão apagados do banco e isso NÃO pode ser desfeito. " +
        "Os projetos e documentos enviados continuam no site.",
      acao: "Remover de vez",
      perigoso: true,
    });
    if (!ok) return;
    iniciar(async () => {
      const r = await removerConta(id);
      setErro(r.erro ?? null);
    });
  };

  return (
    <>
      {dialogo}
      {erro && <span className="text-xs text-destructive">{erro}</span>}
      <Button size="sm" variant="destructive" disabled={pendente} onClick={remover} aria-label={`Remover ${nome}`}>
        <Trash2 />
        {pendente ? "Removendo..." : "Remover"}
      </Button>
    </>
  );
}
