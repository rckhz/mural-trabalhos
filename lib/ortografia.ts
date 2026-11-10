// Corretor ortográfico pt-BR (Hunspell + dicionário VERO), só no servidor.
// Nada é enviado para serviços externos. Não pega erros de gramática (concordância, crase).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadModule } from "hunspell-asm";

export type ErroOrtografia = { palavra: string; sugestoes: string[] };

type Corretor = { spell: (w: string) => boolean; suggest: (w: string) => string[] };

// Carrega uma vez por instância do servidor (~0,4 s) e reaproveita.
let carregando: Promise<Corretor> | null = null;

function corretor() {
  carregando ??= (async () => {
    const pasta = path.join(process.cwd(), "node_modules", "dictionary-pt");
    const [aff, dic, fabrica] = await Promise.all([
      readFile(path.join(pasta, "index.aff")),
      readFile(path.join(pasta, "index.dic")),
      loadModule(),
    ]);
    return fabrica.create(fabrica.mountBuffer(aff, "pt.aff"), fabrica.mountBuffer(dic, "pt.dic"));
  })().catch((e) => {
    carregando = null; // tenta de novo na próxima vez
    throw e;
  });
  return carregando;
}

const MAX_ERROS = 15;

export async function verificarTexto(texto: string): Promise<ErroOrtografia[]> {
  const h = await corretor();
  // Palavras com letras (inclui acentos e hífen interno). Ignora números, siglas e letras soltas.
  const palavras = texto.match(/\p{L}+(?:-\p{L}+)*/gu) ?? [];
  const vistas = new Set<string>();
  const erros: ErroOrtografia[] = [];
  for (const palavra of palavras) {
    if (palavra.length < 2 || palavra === palavra.toUpperCase() || vistas.has(palavra)) continue;
    vistas.add(palavra);
    if (h.spell(palavra)) continue;
    erros.push({ palavra, sugestoes: h.suggest(palavra).slice(0, 3) });
    if (erros.length >= MAX_ERROS) break;
  }
  return erros;
}
