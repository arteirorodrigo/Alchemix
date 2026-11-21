# Auditor de jogos (game_auditor) — Design

Data: 2026-11-21 · Status: aguardando aprovação do dono

## 1. Intenção e o porquê

O dono quer um **testador especialista** que o ajude a **melhorar o jogo**:
joga o Alchemix, diz o que atrapalha a diversão e propõe o que mudar. Ele
deve olhar "de fora", sem o viés de quem construiu, e usar o que já sabemos
do dono e do design (`docs/APRENDIZADOS.md`). O primeiro uso esperado é o
item 2 da lista: Praia e Árvore parecem apertadas demais.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos**
- Um agente em `.claude/agents/game_auditor.md`, chamado quando o dono pede
  "audita o jogo" (ou uma parte: "audita o capítulo 3").
- Ele **joga** os protótipos no Chrome (Playwright), em tamanho de celular,
  tira fotos e olha: texto vazando, peça fora da caixa, botão pequeno, o que
  não se entende sem ler.
- Ele **mede** as fases com um medidor (programa) e julga os números.
- Entrega um **relatório curto**: os 3–5 problemas mais importantes, cada um
  com evidência (número ou foto) e uma sugestão concreta de melhoria.

**Não-objetivos**
- Não altera o jogo. Só aponta e sugere; quem decide é o dono.
- Não audita o jogo completo (`src/`) por enquanto — ele ainda tem a mecânica
  antiga. Fica para quando a mecânica nova for levada para lá.
- Não audita o Modo Livre na primeira versão (tem sorte de propósito; a
  medida de "chute vence" não se aplica igual). Pode entrar depois.

**Anti-objetivos** — se acontecer, falhou mesmo funcionando
- Relatório longo, lista de 30 itens, ou opiniões sem evidência.
- Sugestões que contrariam os pilares ou o gosto do dono (sorte decidindo,
  clique à toa, um erro e acabou).
- Medidor que dá números diferentes do jogo de verdade (lógica copiada que
  fica desatualizada).

## 3. Restrições

- Protótipo Normal: `prototipos/rumo-a-receita.html`, um arquivo só, lógica
  dentro de uma função fechada. Fases são determinísticas pela semente
  (`rngOf(n * 104729 + 7)`), tabuleiro 6×5, toques = mínimo + 2, 3 vidas;
  peças novas vêm de uma fila sorteada pela mesma semente.
- O medidor precisa usar **a mesma lógica do protótipo** (receitas,
  capítulos, semente, fila de peças). Se o protótipo mudar, o medidor
  acompanha sem reescrever as regras à mão.
- Custo de tokens importa: o agente deve ser econômico (rodar o medidor e
  poucas fotos, não jogar dezenas de fases pelo navegador).
- Chromium e Playwright já estão instalados no ambiente.
- Tudo em português do Brasil.

## 4. Abordagens consideradas

1. **Agente próprio + medidor** — escolhida pelo dono. Olhar de fora, mais
   caro por auditoria.
2. Roteiro que o Claude principal segue na mesma conversa — mais barato, mas
   quem audita é quem construiu.
3. Só o medidor — barato e preciso, mas não vê visual, clareza nem diversão.

## 5. O que o dono decidiu

- Abordagem 1, arquivo `game_auditor.md`.

## 6. Como funciona (proposta — chamadas do Claude, o dono pode corrigir)

**Medidor de fases** (`scripts/medir-fases.mjs`, roda com `node`):
- Para cada fase (ou uma faixa: `--fases 20-26`), mede:
  - mínimo de combinações e toques dados (folga);
  - **se tem solução** dentro dos toques, jogando sem errar;
  - **quantos caminhos vencem** (ou uma estimativa, se forem muitos);
  - **chance de um jogador "no chute"** vencer (jogadas aleatórias entre os
    pares que reagem, muitas partidas simuladas);
  - quantas peças úteis o tabuleiro começa tendo.
- Saída: uma tabela curta por fase e um alerta nas fases fora do esperado
  (sem solução, só 1 caminho, chute vence demais, dificuldade que cai dentro
  do capítulo).

**Agente `game_auditor`:**
1. Lê `docs/APRENDIZADOS.md` e a spec do jogo para saber o que é "bom".
2. Roda o medidor nas fases pedidas.
3. Abre o protótipo no Chrome em 412×915 e 320×568, joga 2–3 fases
   escolhidas pelos números (a pior, a melhor, uma típica) e tira fotos.
4. Escreve o relatório: 3–5 problemas, do mais grave ao menor, cada um com
   evidência e sugestão; e uma linha do que está bom.
5. Salva o relatório em `docs/auditorias/AAAA-MM-DD-<tema>.md` (com as fotos
   numa pasta ao lado) e devolve um resumo curto.

## 7. Deixado para quem constrói

- Como o medidor reaproveita a lógica do protótipo (ex.: separar as regras
  num arquivo `.js` que o HTML e o medidor carregam, ou carregar a página
  no Playwright e expor as funções) — desde que seja uma fonte só.
- O algoritmo de busca (completa quando couber, amostragem quando não).
- Os limites exatos dos alertas, explicados no relatório.
