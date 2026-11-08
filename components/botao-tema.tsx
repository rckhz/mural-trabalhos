"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// Alterna claro/escuro e salva a escolha. O tema inicial vem de lib/tema.ts.
export function BotaoTema() {
  const [escuro, setEscuro] = useState<boolean | null>(null);

  useEffect(() => {
    setEscuro(document.documentElement.dataset.theme === "dark");
  }, []);

  if (escuro === null) return null; // só aparece depois de saber o tema atual

  const alternar = () => {
    const novo = !escuro;
    document.documentElement.dataset.theme = novo ? "dark" : "light";
    try {
      localStorage.setItem("tema", novo ? "escuro" : "claro");
    } catch {
      // navegação anônima/bloqueada: o tema muda só nesta visita
    }
    setEscuro(novo);
  };

  const rotulo = escuro ? "Mudar para o modo claro" : "Mudar para o modo escuro";
  return (
    <Button
      variant="outline"
      size="icon-lg"
      onClick={alternar}
      aria-label={rotulo}
      title={rotulo}
      className="fixed right-4 bottom-4 z-50 rounded-full shadow-md print:hidden"
    >
      {escuro ? <Sun /> : <Moon />}
    </Button>
  );
}
