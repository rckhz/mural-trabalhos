"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Campo = { nome: string; rotulo: string; tipo: string; autoComplete: string };

// Formulário simples ligado a uma Server Action que devolve uma mensagem de erro (ou redireciona).
export function FormularioAcao({
  acao,
  campos,
  botao,
}: {
  acao: (estado: string | null, form: FormData) => Promise<string | null>;
  campos: Campo[];
  botao: string;
}) {
  const [erro, enviar, pendente] = useActionState(acao, null);
  return (
    <form action={enviar} className="grid gap-4">
      {campos.map((c) => (
        <div key={c.nome} className="grid gap-1.5">
          <Label htmlFor={c.nome}>{c.rotulo}</Label>
          <Input id={c.nome} name={c.nome} type={c.tipo} autoComplete={c.autoComplete} required />
        </div>
      ))}
      {erro && (
        <p role="alert" className="text-sm text-destructive">{erro}</p>
      )}
      <Button type="submit" size="lg" disabled={pendente}>
        {pendente ? "Aguarde..." : botao}
      </Button>
    </form>
  );
}
