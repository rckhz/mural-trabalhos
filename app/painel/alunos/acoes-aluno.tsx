"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { definirAtivo, novaSenha } from "./acoes";

export function AcoesAluno({ id, ativo }: { id: string; ativo: boolean }) {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const gerarSenha = () => {
    if (!confirm("Voltar a senha deste aluno para a inicial (o que vem antes do @)? A senha atual deixa de funcionar.")) return;
    iniciar(async () => {
      const r = await novaSenha(id);
      setMensagem(r.senha ? `Nova senha: ${r.senha}` : (r.erro ?? null));
    });
  };

  const alternar = () => {
    if (ativo && !confirm("Desativar este aluno? Ele não conseguirá mais entrar.")) return;
    iniciar(() => definirAtivo(id, !ativo));
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {mensagem && <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{mensagem}</code>}
      <Button size="sm" variant="outline" disabled={pendente || !ativo} onClick={gerarSenha}>
        Redefinir senha
      </Button>
      <Button size="sm" variant={ativo ? "destructive" : "secondary"} disabled={pendente} onClick={alternar}>
        {ativo ? "Desativar" : "Reativar"}
      </Button>
    </div>
  );
}
