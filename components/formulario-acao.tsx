"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
          {c.tipo === "password" ? (
            <CampoSenha nome={c.nome} autoComplete={c.autoComplete} />
          ) : (
            <Input id={c.nome} name={c.nome} type={c.tipo} autoComplete={c.autoComplete} required />
          )}
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

// Campo de senha com o "olhinho" para mostrar/esconder o que foi digitado.
function CampoSenha({ nome, autoComplete }: { nome: string; autoComplete: string }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="relative">
      <Input
        id={nome}
        name={nome}
        type={visivel ? "text" : "password"}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        className="pr-9"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1/2 right-0.5 -translate-y-1/2 text-muted-foreground"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
        aria-pressed={visivel}
        title={visivel ? "Esconder senha" : "Mostrar senha"}
      >
        {visivel ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}
