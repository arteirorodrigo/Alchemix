# Referência visual — protótipo do Lovable

Capturado do protótipo feito pelo dono do projeto no Lovable (2026-11-18).
É a **referência de layout e estilo** do jogo.

- `telas/` — capturas em 390×844: início, fase, receitas, presente (anúncio), ajustes.
- `imagens/` — arte em pixel art: elementos (água, pedra, fogo, broto, barro,
  tijolo, vapor, flor, casinha, arco-íris), mascote (frasco) e fundo (vila).
- `tema.css` — cores do tema (variáveis CSS em oklch), incluindo a cor de
  fundo e a sombra de cada elemento (`--el-*`).

## Estilo
- Pixel art, fonte **Pixelify Sans** (Google Fonts) nos títulos e botões.
- Caixas "de papel" creme com borda escura grossa e sombra dura (sem cantos arredondados).
- Botões grandes e coloridos: verde (jogar), azul (anúncio), laranja (dica/presente).
- Fundo: vila mágica com ilhas flutuantes e cachoeiras; caldeirão com rosto no canto.

## Telas
- **Início:** dicas (canto sup. esq.), ajustes (sup. dir.), mascote, logo
  "ALQUIMIA em Cadeia", faixa "💧 + 🪨 = 🟤 e o que mais?", botão JOGAR · Fase N,
  botões Receitas X/Y e Presente.
- **Fase:** voltar, "Fase N", ajustes; painel MOVIMENTOS / OBJETIVO (ícone + barra) / PONTOS;
  tabuleiro 6×7 em moldura de madeira com borda de grama; rodapé com livro,
  "+3 movimentos (ver anúncio)" e "Dica (N restantes)".
- **Receitas:** lista "? + ? = ainda secreta" para as não descobertas.
- **Presente do dia:** anúncio com recompensa (+3 dicas).
- **Ajustes:** sons, vibração, modo canhoto.

## Regras do protótipo (diferentes do design)
- Elementos base: água, pedra, fogo, broto. Receitas: água+pedra=barro,
  barro+fogo=tijolo, água+fogo=vapor, broto+água=flor, tijolo+tijolo=casinha,
  flor+vapor=arco-íris.
- Quando dois elementos reagem, o resultado fica numa casa e a outra é
  **reabastecida com um elemento base pseudoaleatório** (sem gravidade).
