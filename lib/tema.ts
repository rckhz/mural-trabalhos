// Roda no <head> antes da página aparecer, para não piscar no tema errado.
// Usa a escolha salva ("claro"/"escuro") ou, se não houver, o tema do aparelho.
export const scriptTema = `(function () {
  var m = window.matchMedia("(prefers-color-scheme: dark)");
  function salvo() { try { return localStorage.getItem("tema"); } catch (e) { return null; } }
  function aplicar() {
    var t = salvo() || (m.matches ? "escuro" : "claro");
    document.documentElement.dataset.theme = t === "escuro" ? "dark" : "light";
  }
  aplicar();
  m.addEventListener("change", function () { if (!salvo()) aplicar(); });
})();`;
