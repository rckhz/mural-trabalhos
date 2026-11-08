"use client";

import { useState, useTransition } from "react";
import { EyeOff, Globe, Trash2, Undo2 } from "lucide-react";
import { useConfirmar } from "@/components/confirmar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { definirStatus, excluirProjeto } from "@/lib/acoes-projeto";

const info: Record<string, [string, string]> = {
  rascunho: ["Rascunho", "Só a sala e os professores veem este projeto."],
  publicado: ["Publicado", "Aparece no mural para todos."],
  oculto: ["Oculto", "Escondido pelo professor: sai do mural e a sala não pode editar."],
};

export function StatusProjeto({ id, status, professora }: { id: string; status: string; professora: boolean }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const [dialogo, confirmar] = useConfirmar();

  const mudar = (novo: string) =>
    iniciar(async () => {
      const r = await definirStatus(id, novo);
      setErro(r.erro ?? null);
    });

  const excluir = async () => {
    const ok = await confirmar({
      titulo: "Excluir este projeto?",
      texto: "O projeto, os documentos e as fotos serão apagados de vez. Isso NÃO pode ser desfeito.",
      acao: "Excluir de vez",
      perigoso: true,
    });
    if (!ok) return;
    iniciar(async () => {
      const r = await excluirProjeto(id);
      if (r?.erro) setErro(r.erro);
    });
  };

  const [rotulo, texto] = info[status] ?? [status, ""];
  return (
    <Card>
      {dialogo}
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">
            Situação: <Badge variant={status === "publicado" ? "default" : status === "oculto" ? "destructive" : "secondary"}>{rotulo}</Badge>
          </p>
          <p className="text-sm text-muted-foreground">{texto}</p>
          {erro && <p role="alert" className="mt-1 text-sm text-destructive">{erro}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {status !== "publicado" && (
            <Button disabled={pendente} onClick={() => mudar("publicado")}><Globe />Publicar no mural</Button>
          )}
          {status !== "rascunho" && (
            <Button variant="outline" disabled={pendente} onClick={() => mudar("rascunho")}><Undo2 />Voltar para rascunho</Button>
          )}
          {professora && status !== "oculto" && (
            <Button variant="outline" disabled={pendente} onClick={() => mudar("oculto")}><EyeOff />Ocultar</Button>
          )}
          {professora && (
            <Button variant="destructive" disabled={pendente} onClick={excluir}><Trash2 />Excluir projeto</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
