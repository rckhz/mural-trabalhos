"use client";

import { useId, useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { definirAdmin } from "./acoes";

export function InterruptorAdmin({
  id,
  admin,
  bloqueado,
}: {
  id: string;
  admin: boolean;
  bloqueado?: boolean;
}) {
  const rotuloId = useId();
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const alternar = (ligar: boolean) => {
    const pergunta = ligar
      ? "Dar acesso de administrador? Esta conta poderá cadastrar alunos e gerenciar todo o site."
      : "Remover o acesso de administrador? A conta volta a ser aluno da turma.";
    if (!confirm(pergunta)) return;
    iniciar(async () => {
      const r = await definirAdmin(id, ligar);
      setErro(r.erro ?? null);
    });
  };

  return (
    <div className="flex items-center gap-2">
      {erro && <span className="text-xs text-destructive">{erro}</span>}
      <Switch
        aria-labelledby={rotuloId}
        checked={admin}
        disabled={bloqueado || pendente}
        onCheckedChange={alternar}
      />
      <span id={rotuloId} className="text-sm">Administrador</span>
    </div>
  );
}
