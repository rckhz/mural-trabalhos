"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { ReactNode } from "react";

// A âncora funciona também em outra aba. Na mesma aba, recupera a rolagem exata.
export function LinkTrabalho({ id, origem, className, children }: {
  id: string; origem: string; className: string; children: ReactNode;
}) {
  const ancora = "trabalho-" + id;
  const chave = "posicao:" + origem + "#" + ancora;
  useEffect(() => {
    if (location.hash !== "#" + ancora) return;
    const frame = requestAnimationFrame(() => {
      try {
        const salvo = sessionStorage.getItem(chave);
        if (salvo !== null) {
          document.getElementById(ancora)?.focus({ preventScroll: true });
          window.scrollTo(0, Number(salvo));
          sessionStorage.removeItem(chave);
        }
      } catch { /* A âncora continua disponível com o armazenamento bloqueado. */ }
    });
    return () => cancelAnimationFrame(frame);
  }, [ancora, chave]);

  return (
    <Link id={ancora} href={{ pathname: "/projeto/" + id, query: { mural: origem } }} className={className}
      onNavigate={() => {
        try { sessionStorage.setItem(chave, String(window.scrollY)); } catch { /* Navega normalmente. */ }
      }}>
      {children}
    </Link>
  );
}
