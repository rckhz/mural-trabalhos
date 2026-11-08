"use client";

import { useState, useTransition } from "react";
import { useConfirmar } from "@/components/confirmar";
import { Button } from "@/components/ui/button";
import { definirAtivo, novaSenha } from "./acoes";

export function AcoesAluno({ id, ativo }: { id: string; ativo: boolean }) {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const [dialogo, confirmar] = useConfirmar();

  const gerarSenha = async () => {
    const ok = await confirmar({
      titulo: "Redefinir a senha?",
      texto: "A senha volta a ser a inicial (o que vem antes do @). A senha atual deixa de funcionar.",
      acao: "Redefinir",
    });
    if (!ok) return;
    iniciar(async () => {
      const r = await novaSenha(id);
      setMensagem(r.senha ? `Nova senha: ${r.senha}` : (r.erro ?? null));
    });
  };

  const alternar = async () => {
    if (ativo) {
      const ok = await confirmar({
        titulo: "Desativar este aluno?",
        texto: "Ele não conseguirá mais entrar até ser reativado.",
        acao: "Desativar",
        perigoso: true,
      });
      if (!ok) return;
    }
    iniciar(() => definirAtivo(id, !ativo));
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {dialogo}
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
