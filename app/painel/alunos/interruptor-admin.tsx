"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { definirAdmin } from "./acoes";

export function InterruptorAdmin({
  id,
  admin,
  proprio,
}: {
  id: string;
  admin: boolean;
  proprio?: boolean; // a própria conta: não pode ser alterada
}) {
  const rotuloId = useId();
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  // Move o interruptor na hora; se o servidor recusar, volta sozinho.
  const [ligado, setLigado] = useOptimistic(admin);

  const alternar = (ligar: boolean) => {
    const pergunta = ligar
      ? "Dar acesso de administrador? Esta conta poderá cadastrar alunos e gerenciar todo o site."
      : "Remover o acesso de administrador? A conta volta a ser aluno da turma.";
    if (!confirm(pergunta)) return;
    setErro(null);
    iniciar(async () => {
      setLigado(ligar);
      try {
        const r = await definirAdmin(id, ligar);
        if (r.erro) setErro(r.erro);
      } catch {
        setErro("Não foi possível alterar. Recarregue a página e tente de novo.");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Switch
        aria-labelledby={rotuloId}
        checked={ligado}
        disabled={proprio || pendente}
        onCheckedChange={alternar}
      />
      <span id={rotuloId} className="text-sm">
        Administrador
        {proprio && <span className="text-muted-foreground"> (seu próprio acesso não pode ser alterado)</span>}
        {pendente && <span className="text-muted-foreground"> · salvando...</span>}
      </span>
      {erro && <span role="alert" className="text-xs text-destructive">{erro}</span>}
    </div>
  );
}
