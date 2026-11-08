"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import { useConfirmar } from "@/components/confirmar";
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
  const [dialogo, confirmar] = useConfirmar();
  // Move o interruptor na hora; se o servidor recusar, volta sozinho.
  const [ligado, setLigado] = useOptimistic(admin);

  const alternar = async (ligar: boolean) => {
    const ok = await confirmar(
      ligar
        ? {
            titulo: "Dar acesso de administrador?",
            texto: "Esta conta poderá cadastrar alunos e gerenciar todo o site.",
            acao: "Dar acesso",
          }
        : {
            titulo: "Remover acesso de administrador?",
            texto: "A conta volta a ser aluno da turma.",
            acao: "Remover acesso",
            perigoso: true,
          },
    );
    if (!ok) return;
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
      {dialogo}
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
