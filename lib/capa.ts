import { salvarCapa } from "@/lib/acoes-projeto";
import { comprimirFoto } from "@/lib/imagem";
import { supabaseNavegador } from "@/lib/supabase/navegador";

// Reduz a imagem, envia ao bucket "capas" e grava o caminho no projeto.
// Devolve a mensagem de erro, ou null se deu certo.
export async function enviarCapa(projetoId: string, arquivo: File): Promise<string | null> {
  try {
    const { blob, extensao } = await comprimirFoto(arquivo);
    const caminho = `${projetoId}/${crypto.randomUUID()}.${extensao}`;
    const supabase = supabaseNavegador();
    const { error } = await supabase.storage.from("capas").upload(caminho, blob, { contentType: blob.type });
    if (error) throw error;
    const r = await salvarCapa(projetoId, caminho);
    if (r.erro) {
      await supabase.storage.from("capas").remove([caminho]);
      return r.erro;
    }
    return null;
  } catch (e) {
    return `Não foi possível enviar a capa (${e instanceof Error ? e.message : String(e)}).`;
  }
}
