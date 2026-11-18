# Alquimia em Cadeia — Design

Data: 2026-11-18 · Status: rascunho para aprovação

## 1. Intenção e o porquê

Um jogo de quebra-cabeça para Android, para jogar no ônibus e no metrô, que
gere renda com anúncios.

O dono do projeto gosta de **desafio de lógica** (referência: Meowdoku) e da
**sensação de resolver** um quebra-cabeça — com ou sem dica. Ele também quer o
lado tátil e colorido de mexer nas peças e ver reações em cadeia (referência:
Candy Crush) e a curiosidade de **descobrir receitas** combinando elementos
("água + terra = barro; barro + fogo = tijolo"). O jogo tem que ser
**infinito, sem nunca se repetir**.

Em uma frase: *Candy Crush sem sorte* — você troca peças de lugar, elementos
vizinhos reagem e se transformam em cadeia, mas o tabuleiro é fixo e os
movimentos são contados, então cada fase é um quebra-cabeça com solução que
se resolve pensando.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos (v1)**
- Núcleo de quebra-cabeça desafiador, determinístico, com solução garantida.
- Fases infinitas geradas por algoritmo, que nunca se repetem.
- Descoberta de receitas como parte do jogo (livro de receitas).
- Laboratório livre com limite diário de experimentos.
- Desafio diário (mesma fase para todos no dia) com sequência de dias.
- Anúncios AdMob (com recompensa e entre fases).
- App Android publicável na Google Play.

**Não-objetivos (v1)** — podem vir depois
- iOS, versão web pública, compras dentro do app (incl. "remover anúncios"),
  contas, salvamento na nuvem, ranking online, eventos sazonais.
- Elementos gerados proceduralmente (ver §6.4 — fica para v2).

**Anti-objetivos** — se acontecer, falhou mesmo que funcione
- Sorte decidindo o resultado (peças aleatórias caindo, sorteio no meio da fase).
- Fase que só se resolve no chute, ou que não tem solução.
- Fases que se repetem.
- Anúncio forçado no meio de uma fase.
- Limite do laboratório tão apertado que vira muro de frustração.
- Dica que entrega a fase inteira (mata a sensação de "resolvi").
- Copiar nome, arte ou regras de jogos existentes.

## 3. Restrições

- **Contexto de uso:** celular em pé no ônibus, uma mão, sessões de 1–5 min,
  sinal instável. Retrato (portrait).
- **Controle:** só toque, tolerante a balanço: tocar uma peça e depois tocar a
  vizinha para trocar (deslizar também funciona, mas tocar-tocar é o padrão).
  Alvos de toque grandes (≥ 48 dp).
- **Sem som obrigatório:** tudo legível só pela tela; som e vibração opcionais.
- **Offline:** o jogo inteiro funciona sem internet; só anúncios precisam de
  rede. Sem rede, as ofertas de anúncio somem ou ficam desativadas.
- **Pausa instantânea:** fechar/minimizar a qualquer momento não perde nada;
  ao voltar, a fase está exatamente onde parou.
- **Aparelhos simples:** rodar liso em Android de entrada (alvo: Android 8+).
- **Idioma:** português do Brasil, com textos separados do código para
  traduzir depois.
- **Original:** nome, arte e textos próprios.

## 4. Abordagens consideradas

| | Abordagem | Troca |
|---|---|---|
| ✅ | **TypeScript + Phaser, empacotado com Capacitor; AdMob via plugin do Capacitor** | Pode ser rodado e testado no navegador durante o desenvolvimento (capturas de tela, testes automáticos do gerador). Mesmo código serve iOS/web no futuro. Um pouco menos eficiente que motor nativo — irrelevante para 2D. |
| | Godot | Ótimo para 2D, mas centrado no editor visual; o desenvolvimento aqui não conseguiria ver nem testar o jogo rodando. |
| | Unity | Padrão da indústria e melhor integração de anúncios, mas pesado, exige editor e tem licença; exagero para o escopo. |

**Escolhida:** TypeScript + Phaser + Capacitor + AdMob. O dono delegou a
escolha técnica; foi decisão do Claude, apresentada e confirmada.

## 5. Mecânica do quebra-cabeça (decidido)

### 5.1 Tabuleiro e peças
- Grade retangular; tamanho cresce com a progressão (começa ~5×5, chega ~7×8).
- Cada casa: vazia, bloqueada (parede) ou com um elemento.
- Começa com 4 elementos básicos: 🔥 fogo, 💧 água, 🪨 terra, 💨 ar.

### 5.2 Movimento
- Um movimento = trocar duas peças ortogonalmente vizinhas. Custa 1 movimento.
- Troca que não gera reação é permitida (faz parte do planejamento).
- Cada fase tem um limite de movimentos.

### 5.3 Reações (o coração do jogo)
- Receitas são pares: A + B → C (ordem não importa).
- Quando dois elementos vizinhos (ortogonais) têm uma receita, eles reagem: as
  duas casas viram uma peça C e uma casa vazia.
- Depois das reações, as peças **caem** para ocupar casas vazias (gravidade),
  mas **nada novo cai do céu** — não há reposição aleatória. A queda pode
  juntar novos pares → **reação em cadeia**.
- Repete reação → queda até o tabuleiro estabilizar.
- Tudo é determinístico: o mesmo estado + o mesmo movimento sempre dão o mesmo
  resultado.

### 5.4 Objetivo da fase
- Meta do tipo "crie 2 🧱 tijolos" (pode combinar metas: "1 🧱 e 1 ☁️").
- Ao ser criada, uma peça-meta é **coletada** (voa para o contador e some),
  liberando espaço e podendo disparar mais quedas e reações.
- Vence ao cumprir a meta dentro do limite. Perde ao zerar os movimentos.
- Estrelas (1–3) por movimentos que sobraram.

### 5.5 Descoberta de receitas
- O **livro de receitas** registra toda receita que o jogador já viu acontecer.
- Uma fase pode introduzir uma receita ainda desconhecida: ela aparece como
  "❓" na meta ou no tabuleiro até acontecer pela primeira vez; então uma
  animação revela "🔥 + 💨 = Fumaça" e ela entra no livro.
- Fases nunca exigem conhecer uma receita que o jogador ainda não tem como
  descobrir naquela fase.

### 5.6 Laboratório livre
- Tela com um caldeirão: o jogador escolhe dois elementos que já possui e
  mistura. Resultado: receita nova (vai para o livro) ou "nada acontece"
  (também registrado, para não repetir a tentativa).
- Custa 1 **experimento**. Limite de 10 experimentos, recarrega com o tempo
  (decisão do Claude: 1 a cada 30 min, até 10). Ver anúncio: +5.
- Elementos novos descobertos no laboratório passam a poder aparecer nas fases.

### 5.6.1 Quem manda na progressão (decisão do Claude)
- **As fases mandam.** Existe um currículo fixo: a fase N sempre usa o mesmo
  conjunto de receitas para todos os jogadores, e é ela que introduz cada
  receita nova. Assim a fase N é igual para todos e "nunca se repete" vale
  globalmente, não por jogador.
- **O laboratório é opcional, um bônus de curiosidade.** Ele nunca é
  necessário para avançar, e o limite de experimentos nunca trava a
  progressão.
- O laboratório só combina elementos que o jogador já tem. Se ele descobrir lá
  uma receita antes da fase que a introduz, isso é recompensa: a fase mostra a
  receita como já conhecida, sem o "❓".

### 5.7 Desafio diário
- Uma fase especial por dia, igual para todos (gerada a partir da data).
- Sequência de dias jogados, com marcador visível no menu.
- (Decisão do Claude) Libera a partir da fase 10 e usa só receitas dos níveis
  1–2 da árvore, que todo jogador nesse ponto já conhece. Não revela receitas
  novas.

## 6. Conteúdo e infinitude

### 6.1 Receitas da v1 (feitas à mão)
Uma árvore de receitas escrita à mão, intuitiva, com ~40–60 elementos em
níveis. Começo sugerido (o resto fica para o construtor, seguindo o mesmo
espírito "faz sentido no mundo real/mágico"):

| Nível | Receitas |
|---|---|
| 1 | 💧+🪨 = Barro · 🔥+💧 = Vapor · 🔥+🪨 = Lava · 💨+🪨 = Poeira · 🔥+💨 = Fumaça · 💧+💨 = Nuvem |
| 2 | Barro+🔥 = Tijolo · Lava+💧 = Pedra · Nuvem+💧 = Chuva · Vapor+💨 = Névoa · Poeira+💧 = Lama… |
| 3+ | Pedra+🔥 = Metal · Chuva+🪨 = Planta · … até poções: ex. Planta+Névoa = Poção do Sono |

### 6.2 Fases infinitas
- Fases geradas por algoritmo a partir de uma semente (número da fase).
- **Toda fase gerada é verificada por um resolvedor** antes de ser mostrada:
  precisa ter solução dentro do limite de movimentos.
- A dificuldade vem de: tamanho do tabuleiro, número de receitas em jogo,
  tamanho das cadeias necessárias, folga de movimentos e quantidade de
  soluções (menos soluções = mais difícil).
- "Nunca se repete": cada fase tem semente única; guardar uma impressão
  digital das fases já geradas e descartar repetidas.
- Curva de dificuldade com respiros: subir aos poucos, alternar fases mais
  fáceis depois de uma muito difícil.

### 6.3 Dica
- Mostra **só o próximo movimento** de uma solução a partir do estado atual.
- Se o estado atual já não tem solução, a dica sugere desfazer.

### 6.4 v2 (fora da v1): elementos procedurais
Depois da árvore feita à mão, uma camada gerada: elementos com propriedades
(quente, frio, úmido, seco, sólido, vivo, brilhante…) cujas combinações são
calculadas, com nome e visual montados a partir das propriedades. Garante
descoberta infinita além de fases infinitas. A v1 deve deixar o sistema de
receitas preparado para isso (receitas como dados, não código fixo).

## 7. Anúncios (AdMob)

**Com recompensa** (o jogador escolhe assistir):
- Ao perder: "+3 movimentos e continue".
- Durante a fase: desfazer o último movimento (1 grátis por fase, depois anúncio).
- Dica de um passo (decisão do Claude: 1 grátis por dia, depois anúncio).
- Laboratório: +5 experimentos.

**Entre fases (intersticial):**
- Nunca no meio de uma fase; nunca antes da fase 5.
- No máximo a cada 2 fases concluídas e com intervalo mínimo de ~90 s
  (decisão do Claude; ajustável por configuração).

Sem banner na tela de jogo. Consentimento de privacidade (UMP do Google)
exigido antes de exibir anúncios.

## 8. Telas

- **Mapa de fases** (caminho de fases numeradas, com estrelas) + botão do
  desafio diário + sequência de dias.
- **Tela da fase:** meta e movimentos no topo, tabuleiro no centro, botões
  desfazer/dica embaixo, ao alcance do polegar.
- **Livro de receitas:** grade de elementos descobertos e "?" para os que
  faltam, por nível.
- **Laboratório:** caldeirão, elementos disponíveis, contador de experimentos.
- **Vitória / derrota:** celebração grande na vitória (a "sensação de
  resolver"), oferta de anúncio na derrota.

```
 Fase 23   Meta: 🧱×2   Movimentos: 3
 ┌──┬──┬──┬──┐
 │💧│🪨│🔥│💨│
 │🔥│💧│🪨│💧│
 │🪨│💨│🔥│🪨│
 └──┴──┴──┴──┘
   [↶ desfazer]     [💡 dica]
```

## 9. Deixado para o construtor

- Ordem exata de resolução quando várias reações são possíveis ao mesmo
  tempo, e em qual das duas casas o resultado C fica — desde que seja
  determinístico, previsível pelo jogador e explicado visualmente.
- Algoritmo do gerador e do resolvedor (precisa rodar rápido no celular ou
  gerar fases adiantadas).
- Resto da árvore de receitas (§6.1), obstáculos extras (paredes, gelo etc.)
  para variedade.
- Estilo de arte e animações (visual próprio; pode começar com formas
  simples e trocar depois), sons.
- Estrutura de dados do salvamento local.
- Passos de publicação na Google Play (o dono precisa de conta de
  desenvolvedor, taxa única ~US$ 25, e conta AdMob).
