// Roda no <head> antes da página aparecer, para não piscar no tema errado.
// O padrão é sempre o claro; só fica escuro se a pessoa tiver escolhido ("escuro").
export const scriptTema = `(function () {
  var t = null;
  try { t = localStorage.getItem("tema"); } catch (e) {}
  document.documentElement.dataset.theme = t === "escuro" ? "dark" : "light";
})();`;
