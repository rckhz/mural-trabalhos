"use client";

import { useActionState, useState, useTransition } from "react";
import { FolderPlus, Trash2 } from "lucide-react";
import { useConfirmar } from "@/components/confirmar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarAno, removerAno } from "./acoes";

export function NovoAno({ sugestao }: { sugestao: number }) {
  const [erro, enviar, pendente] = useActionState(criarAno, null);
  return (
    <form action={enviar} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="ano">Ano</Label>
        <Input id="ano" name="ano" type="number" min={2020} max={2100} defaultValue={sugestao} required />
      </div>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      <Button type="submit" disabled={pendente}>
        <FolderPlus />
        {pendente ? "Criando..." : "Criar ano com as 6 turmas"}
      </Button>
    </form>
  );
}

export function RemoverAno({ ano }: { ano: number }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const [dialogo, confirmar] = useConfirmar();

  const remover = async () => {
    const ok = await confirmar({
      titulo: `Remover o ano ${ano}?`,
      texto: "A pasta do ano e as 6 turmas dele somem do site.",
      acao: "Remover",
      perigoso: true,
    });
    if (!ok) return;
    iniciar(async () => setErro((await removerAno(ano)).erro ?? null));
  };

  return (
    <>
      {dialogo}
      <Button size="sm" variant="ghost" disabled={pendente} onClick={remover} aria-label={`Remover o ano ${ano}`}>
        <Trash2 />Remover
      </Button>
      {erro && <p role="alert" className="w-full text-sm text-destructive">{erro}</p>}
    </>
  );
}
