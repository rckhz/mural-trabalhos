import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { BotaoTema } from "@/components/botao-tema";
import { scriptTema } from "@/lib/tema";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Mural de Trabalhos",
  description: "Projetos, protótipos e documentos das turmas do Ensino Médio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: o script abaixo define data-theme antes do React carregar.
    <html lang="pt-BR" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>
        {children}
        <BotaoTema />
      </body>
    </html>
  );
}
