# Aprendizados do projeto

Documento vivo. Revisado no início de cada sessão e atualizado ao fechar.
Mantenha curto: refine, junte e apague o que deixar de valer.

Última atualização: 2026-11-22 (fim da sessão 3 — dono pausou o projeto)

## Como trabalhamos melhor

- **Testar a diversão antes de construir.** Toda mecânica nova começa como um
  teste de uma página para jogar no celular. Só depois de o dono dizer "é
  isso" vem o processo completo (design, plano, revisores, testes).
- **Toda proposta visual = 3 ideias em imagem.** Layout, tela, fonte, cor:
  montar 3 opções lado a lado, tirar print e abrir para o dono. Nunca propor
  só em texto ou desenho de letras. Ele decide rápido vendo; pode misturar
  ("a 1, mas com os ícones de baixo"). Funcionou de novo com a tela Fases.
- **O dono decide jogando, não lendo — no celular, pelo link.** Fluxo que deu
  certo: fazer → testar no Chrome (Playwright, 412×915 e 320×568) → commit →
  perguntar "levo para o link dos amigos?" → push no ramo do Pages → esperar a
  publicação terminar (~30 s) e só então mandar o link. Abrir o link durante a
  publicação quebra as imagens (aconteceu).
- **Quando o dono diz "está ruim" sem detalhar:** investigar sozinho (jogar,
  medir com `scripts/medir-fases.mjs`, ver capturas), trazer hipóteses
  concretas e uma pergunta curta. Se ele responder "não sei expressar", não
  insistir em perguntas: oferecer um teste jogável comparando versões.
- **Reação forte e curta = corrigir rápido e anotar.** "Muito ruim" sobre o
  erro trocar peças levou duas rodadas (só as evoluídas → nenhuma); na
  dúvida, ir direto ao mais simples que ele disse ("mantenha a peça").
- **Opiniões de amigos (PDFs, prints):** conferir cada ponto contra o jogo e
  os números; muitos não chegaram a jogar. O que se repetiu entre eles (som,
  comemoração, clareza da seleção) valeu a pena.
- **Vídeo de referência:** extrair quadros com `ffmpeg` em folhas (1 por
  segundo) e descrever o fluxo antes de propor.
- **Mensagens curtas, poucas opções de cada vez.** Quando ele responde só uma
  letra, seguir; quando a frase vier ambígua, confirmar com 2–3 leituras.
- **Custo de tokens importa.** Processo pesado só depois da ideia validada.
- **Verificar com print antes de mostrar.** Já pegou texto vazando, faixa
  quebrando em 320 px, emoji que parece botão desligado (➕ → "+3").

## Sobre o dono

- Gosta de **desafio de lógica** e da sensação de **resolver**; o prazer no
  Meowdoku era **eliminar casas com lógica até descobrir a resposta**.
- **Descobrir receitas** é o que mais o empolga no tema alquimia.
- Não gosta de: clicar à toa, sorte decidindo, rigidez (um erro e acabou),
  **perder o que já fez** (erro não pode mexer nas peças), carregamento lento.
- Gosta do **fluxo de jogos casuais** (vídeo de um jogo de parafusos): moedas
  por fase, ajudas com contador, objetivo que "enche", dobrar com anúncio,
  próxima fase direto.
- Não quer copiar jogos: quer entender o que cada um propõe e criar o nosso.
- Referências: Candy Crush, Block Blast, Meowdoku, HexMoji; portais Poki e
  CrazyGames. Conceito original em `docs/referencias/` (PDF + tela de título).
- **Fonte:** tem de acompanhar o estilo pixel e ser de **traço reto**;
  rejeitou fontes arredondadas e a Pixelify (embola, "5" parece "S").

## Design de jogos (o que aprendemos)

- **Regras previsíveis** são essenciais em jogo de lógica: se o jogador não
  prevê o resultado, ele chuta em vez de deduzir.
- **Errar deve custar algo, não a partida inteira.** No Alchemix: 1 vida e
  1 toque, e **as peças ficam no lugar**.
- **Fases geradas por computador** precisam ser medidas: o medidor mostrou
  22 de 39 fases com problema (sem solução limpa, dica que perdia, serra de
  dificuldade); escolher o sorteio por fase resolveu a maioria.
- **Peças não se movem → receitas longas dependem da posição**, não do
  conhecimento. Mais toques não resolve; a dica tem de olhar o tabuleiro.
- **Fácil demais não prende (sessão 3, sem causa confirmada).** Números:
  média de 3 combinações por fase, 29 de 39 fases em 2–3 jogadas, 15 fases
  "2×/3× de receita de 1 passo", e rede de segurança enorme (3 vidas, erro
  sem custo nas peças, +2 toques, dica que sempre acerta, martelo, +3).
  Hipóteses: fases curtas, repetição, sem risco, nada novo por capítulo.
- **Com as 5 bases, todo par reage** — o erro real é gastar uma peça de que
  você ia precisar.
- **O que os mais jogados do Poki/CrazyGames têm em comum:** entende-se sem
  ler, um toque, "arrumar a bagunça", a ordem importa e é visível, erro suave,
  clássico com roupa nova. Dedução pura existe mas é nicho.
- **Pilares do nosso jogo (aprovados):** deduzir eliminando; a alquimia é o
  conhecimento que você usa; acertar vira espetáculo; regras que se somam.

## Estado atual

- **Nome:** ALCHEMIX — "reações em cadeia". Repositório
  `arteirorodrigo/Alchemix`; pasta local `Projetos/Alchemix`.
- **Visual aprovado ("D"):** ilhas ao entardecer, roxo e dourado; caixas
  roxo-escuras ou madeira com filete dourado. **Fonte: Jersey 10**
  (`prototipos/Jersey10.woff2`, com `.ttf` de reserva).
- **Link dos amigos:** https://arteirorodrigo.github.io/Alchemix/prototipos/
  (GitHub Pages do ramo `claude/claude-superpower-skills-nagpbr`; está em dia
  com tudo da sessão 3). Tela de fases: `rumo-a-receita.html#fases`.
- **Modo Normal** (`prototipos/rumo-a-receita.html` + regras em
  `prototipos/regras-normal.js`, sons em `som.js`, pré-carga em
  `precarga.js`):
  - 5 capítulos, 39 fases; metas em rampa; sorteio ajustado por fase
    (`scripts/escolher-sementes.mjs` → colar `AJUSTE` nas regras).
  - Tocar uma e outra **ou arrastar** até a vizinha; o novo nasce na 2ª.
  - Erro: −1 ❤️ −1 toque, peças ficam. Peça pronta de meta 2×/3× fica
    travada com ✓; frasco no objetivo enche.
  - 💡 só aponta jogada que ainda vence; avisa quando não há saída.
  - Moedas por fase (+sem erro, +toques sobrando, ▶ dobrar com anúncio
    simulado); ajudas com estoque: 💡 3, 🔨 2, +3 toques 1 (depois 25/40/50 🪙).
  - Sons com liga/desliga no ⏸; vitória com estrelas, confete e receitas
    novas; tela **Fases** (menu e ⏸) com melhores estrelas e cadeado.
  - Artes em WebP 160 px (~280 KB tudo), baixadas logo no início.
- **Modo Livre** (`modo-livre/`): sem som e sem arrastar ainda.
- **Auditor:** "audita o jogo" → agente `.claude/agents/game_auditor.md`;
  medidor `node scripts/medir-fases.mjs` (~30 s); relatórios em
  `docs/auditorias/`.
- **Jogo completo (`src/`, Phaser):** ainda com a mecânica antiga e a
  Pixelify. Nada da sessão 3 foi levado para lá.
- **Próximos passos (ao voltar):**
  1. **Desafio/progressão** — o dono acha fácil e que não prende. Proposta em
     aberto: teste jogável de 6 fases com (A) metas compostas e mais longas
     (5–8 combinações, folga +1) e (B) rede menor (erro −2 toques, dica tira
     estrela, menos ajudas grátis); depois (C) uma novidade por capítulo
     (gelo, pedra bloqueada). Deixar ele jogar e comparar.
  2. Fases ainda apertadas: Tempestade, Árvore, Castelo.
  3. Modo Livre: som e arrastar.
  4. Logo e ícone; imagens para o Instagram.
  5. Levar tudo para o jogo completo.
