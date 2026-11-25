import type { Metadata } from "next";
import "./globals.css";
import { Barlow, Barlow_Semi_Condensed } from "next/font/google";
import { BotaoTema } from "@/components/botao-tema";
import { scriptTema } from "@/lib/tema";
import { cn } from "@/lib/utils";

const texto = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--fonte-texto" });
const titulos = Barlow_Semi_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--fonte-titulo" });

export const metadata: Metadata = {
  title: "Mural de Trabalhos",
  description: "Projetos, protótipos e documentos das turmas do Ensino Médio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: o script abaixo define data-theme antes do React carregar.
    <html lang="pt-BR" className={cn("font-sans", texto.variable, titulos.variable)} suppressHydrationWarning>
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
