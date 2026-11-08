// Reduz a foto no navegador antes de enviar (economiza o 1 GB do Supabase).
// Lado maior até 1600 px, WebP (ou JPEG no Safari, que não gera WebP), até 1 MB.
const LADO_MAXIMO = 1600;
const LIMITE = 1_000_000;

const gerar = (canvas: HTMLCanvasElement, tipo: string, qualidade: number) =>
  new Promise<Blob | null>((r) => canvas.toBlob(r, tipo, qualidade));

export async function comprimirFoto(arquivo: File): Promise<{ blob: Blob; extensao: string }> {
  const imagem = await createImageBitmap(arquivo).catch(() => {
    throw new Error("o navegador não conseguiu abrir essa imagem. Tente salvar em JPG ou PNG");
  });
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(imagem.width * escala);
  canvas.height = Math.round(imagem.height * escala);
  canvas.getContext("2d")!.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  imagem.close();

  const teste = await gerar(canvas, "image/webp", 0.8);
  const tipo = teste?.type === "image/webp" ? "image/webp" : "image/jpeg";
  for (const qualidade of [0.8, 0.65, 0.5, 0.35]) {
    const blob = await gerar(canvas, tipo, qualidade);
    if (blob && blob.size <= LIMITE) return { blob, extensao: tipo === "image/webp" ? "webp" : "jpg" };
  }
  throw new Error("Foto grande demais mesmo depois de reduzida.");
}
