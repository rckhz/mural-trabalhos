import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Corretor ortográfico (Hunspell em WebAssembly) roda só no servidor, fora do bundle.
  serverExternalPackages: ["hunspell-asm"],
  // O dicionário pt-BR é lido do disco em tempo de execução: garante que vá junto no deploy.
  outputFileTracingIncludes: {
    "/projeto/**": ["./node_modules/dictionary-pt/index.aff", "./node_modules/dictionary-pt/index.dic"],
  },
};

export default nextConfig;
