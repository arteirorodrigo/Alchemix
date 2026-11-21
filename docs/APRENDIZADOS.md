# Aprendizados do projeto

Documento vivo. Revisado no início de cada sessão e atualizado ao fechar.
Mantenha curto: refine, junte e apague o que deixar de valer.

Última atualização: 2026-11-21 (sessão 3, revisão inicial)

## Como trabalhamos melhor

- **Testar a diversão antes de construir.** Toda mecânica nova começa como um
  teste de uma página para jogar no celular. Só depois de o dono dizer "é
  isso" vem o processo completo (design, plano, revisores, testes).
- **Toda proposta visual = 3 ideias em imagem.** Layout, tela, fonte, cor:
  montar 3 opções lado a lado, tirar print e abrir para o dono. Nunca propor
  só em texto ou desenho de letras. Ele decide rápido vendo; pode misturar
  ("a 1, mas com os ícones de baixo").
- **O dono decide jogando, não lendo.** Documentos longos e listas de opções
  rendem menos que um link jogável.
- **Quando o dono diz "está ruim" sem detalhar:** investigar sozinho (jogar,
  fazer as contas, ver capturas), trazer hipóteses concretas e uma pergunta
  curta. Funcionou bem com as fases (3 problemas medidos → "todos").
- **Mensagens curtas, poucas opções de cada vez.** Quando ele responde só uma
  letra, seguir; quando a frase vier ambígua, confirmar com 2–3 leituras.
- **Custo de tokens importa.** Processo pesado só depois da ideia validada.
- **Verificar com print antes de mostrar.** Tirar foto da tela (Chrome via
  Playwright) e olhar: já pegou texto vazando, emoji fora da caixa, quebra
  de linha.

## Sobre o dono

- Gosta de **desafio de lógica** e da sensação de **resolver**; o prazer no
  Meowdoku era **eliminar casas com lógica até descobrir a resposta**.
- **Descobrir receitas** é o que mais o empolga no tema alquimia.
- Não gosta de: clicar à toa, sorte decidindo, rigidez (um erro e acabou).
- Não quer copiar jogos: quer entender o que cada um propõe e criar o nosso.
- Referências: Candy Crush, Block Blast, Meowdoku, HexMoji; portais Poki e
  CrazyGames. Conceito original em `docs/referencias/` (PDF + tela de título).
- **Fonte:** tem de acompanhar o estilo pixel e ser de **traço reto**;
  rejeitou fontes arredondadas e a Pixelify (embola, "5" parece "S").

## Design de jogos (o que aprendemos)

- **Regras previsíveis** são essenciais em jogo de lógica: se o jogador não
  prevê o resultado, ele chuta em vez de deduzir.
- **Errar deve custar algo (estrelas, vidas), não a partida inteira.**
- **Fases geradas por computador** tendem a parecer arbitrárias; o gerador
  precisa medir qualidade (vários caminhos, chute raramente vence).
- **Fase que se resolve com 1 combinação não é fase.** Receitas de um passo
  viram metas repetidas ("2× Vapor"). Dentro do capítulo, fácil → difícil.
- **Com as 5 bases, todo par reage** — não dá para "errar" juntando bases. O
  erro real é gastar uma peça de que você ia precisar.
- **O que os mais jogados do Poki/CrazyGames têm em comum:** entende-se sem
  ler, um toque, "arrumar a bagunça", a ordem importa e é visível, erro suave,
  clássico com roupa nova. Dedução pura existe mas é nicho.
- **Pilares do nosso jogo (aprovados):** deduzir eliminando; a alquimia é o
  conhecimento que você usa; acertar vira espetáculo; regras que se somam.

## Estado atual

- **Nome:** ALCHEMIX — "reações em cadeia". Repositório renomeado para
  `arteirorodrigo/Alchemix`; pasta local `Projetos/Alchemix`.
- **Visual aprovado ("D"):** o mundo de ilhas do jogo ao entardecer (lua,
  estrelas) com roxo e dourado do conceito; caixas roxo-escuras ou madeira
  com filete dourado. **Fonte: Jersey 10** (`prototipos/Jersey10.ttf`).
- **Testes jogáveis** — online para amigos: https://arteirorodrigo.github.io/Alchemix/prototipos/
  (GitHub Pages, ramo `claude/claude-superpower-skills-nagpbr`; atualiza a cada push
  **nesse ramo** — se a sessão trabalhar em outro ramo, levar as mudanças para lá
  para o link dos amigos atualizar).
  No computador: abrir `prototipos/index.html` no Chrome.
  - Menu: **Normal** e **Modo Livre** (→ Tempo 1 min ou Toque 30 toques).
  - Normal = `rumo-a-receita.html`: capítulos destravam bases (Água+Fogo →
    Terra → Vento → Vida → capítulo 5 **Mundo**), metas com quantidade,
    toques = mínimo + 2, layout "1" (objetivo grande, ⏸ com
    recomeçar/pular/ajuda, 📖 e 💡 embaixo). Partida ocupa a tela inteira no
    celular.
  - Modo Livre = `modo-livre/`: juntar vizinhos; final ★ some e pontua pelo
    tamanho da cadeia; peças caem e entram bases aleatórias; sem livro, sem
    embaralhar; travou = fim. Não conta para o livro.
- **Coleção:** 44 elementos, todos com arte própria em
  `prototipos/img/elementos/` (inclusive Terra).
- **Auditor:** peça "audita o jogo" (ou uma fase/capítulo). Agente em
  `.claude/agents/game_auditor.md`; medidor `node scripts/medir-fases.mjs`
  (~30 s, mesmas regras do jogo via `prototipos/regras-normal.js`);
  relatórios em `docs/auditorias/`.
- **Peça concluída fica travada:** em metas 2×/3×, a peça pronta fica no
  tabuleiro com ✓ e não se mexe mais.
- **Jogo completo (`src/`, Phaser):** ainda tem a mecânica antiga (trocar
  peças) e a fonte Pixelify (rejeitada). Só a tela inicial recebeu o visual D
  e o nome novo.
- Imagens de referência em `docs/referencias/`: folha de elementos, livro de
  receitas (fundo transparente), layouts, telas no estilo novo.
- **Próximos passos (lista do dono):**
  1. ~~Ajustar toda a coleção~~ — feito (44 artes novas).
  2. Melhorar as fases (Praia e Árvore parecem apertadas demais).
  3. Fazer o logo e criar o ícone.
  4. Criar imagens para o Instagram.
  5. Levar tudo para o jogo completo (mecânica nova, visual D, Jersey 10 no
     lugar da Pixelify, as 44 artes).
