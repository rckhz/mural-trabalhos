import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mural de Trabalhos",
  description: "Projetos, protótipos e documentos das turmas do Ensino Médio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
