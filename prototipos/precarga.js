// Baixa logo no início todas as artes, o mascote e a fonte (~280 KB), para nada carregar no meio da partida.
// Uso: <script src="precarga.js" data-base=""></script>  (data-base = caminho até a pasta prototipos/, ex. "../")
(function () {
  const base = (document.currentScript && document.currentScript.dataset.base) || '';
  const ARTES = ['abelha','agua','arbusto','arcoiris','areia','arvore','barro','casinha','castelo','chuva','cinza','deserto','fazenda','ferramenta','flor','fogo','ilha','lago','lava','mel','metal','minerio','montanha','musgo','nuvem','obsidiana','onda','pantano','passaro','peixe','poeira','praia','raio','sabao','sol','tempestade','terra','tijolo','tornado','vapor','vaso','vento','vida','vidro'];
  const ir = () => {
    ARTES.forEach(n => { const i = new Image(); i.decoding = 'async'; i.src = base + 'img/elementos/' + n + '.webp'; });
    new Image().src = base + 'img/mascote-frasco.webp';
    if (document.fonts && document.fonts.load) document.fonts.load('16px "Jersey 10"').catch(() => {});
  };
  if (document.readyState === 'complete') ir(); else addEventListener('load', ir, { once: true });
})();
