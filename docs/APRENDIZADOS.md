# Aprendizados do projeto

Documento vivo. Revisado no início de cada sessão e atualizado ao fechar.
Mantenha curto: refine, junte e apague o que deixar de valer.

Última atualização: 2026-11-18 (sessão 1)

## Como trabalhamos melhor

- **Testar a diversão antes de construir.** Toda mecânica nova começa como um
  teste de uma página para jogar no celular. Só depois de o dono dizer "é
  isso" vem o processo completo (design, plano, revisores, testes).
- **Comparar 2–3 ideias lado a lado** é melhor que refinar uma no escuro.
- **O dono decide jogando, não lendo.** Documentos longos e listas de opções
  rendem menos que um link jogável.
- **Quando o dono diz "está ruim" sem detalhar:** investigar sozinho (jogar,
  ver capturas), trazer hipóteses concretas e uma pergunta curta.
- **Mensagens curtas, poucas opções de cada vez.**
- **Custo de tokens importa.** Processo pesado (muitos agentes, revisões) só
  depois da ideia validada. Para explorar, ser leve e rápido.

## Sobre o dono

- Gosta de **desafio de lógica** e da sensação de **resolver**; o prazer no
  Meowdoku era **eliminar casas com lógica até descobrir a resposta**.
- **Descobrir receitas** é o que mais o empolga no tema alquimia.
- Não gosta de: clicar à toa, sorte decidindo, rigidez (um erro e acabou).
- Não quer copiar jogos: quer entender o que cada um propõe e criar o nosso.
- Referências: Candy Crush, Block Blast, Meowdoku, HexMoji; portais Poki e
  CrazyGames.

## Design de jogos (o que aprendemos)

- **Regras previsíveis** são essenciais em jogo de lógica: se o jogador não
  prevê o resultado, ele chuta em vez de deduzir.
- **Errar deve custar algo (estrelas, vidas), não a partida inteira.**
- **Fases geradas por computador** tendem a parecer arbitrárias; o gerador
  precisa medir qualidade (vários caminhos, chute raramente vence).
- **O que os mais jogados do Poki/CrazyGames têm em comum:** entende-se sem
  ler, um toque, "arrumar a bagunça", a ordem importa e é visível, erro suave,
  clássico com roupa nova. Dedução pura existe mas é nicho.
- **Pilares do nosso jogo (aprovados):** deduzir eliminando; a alquimia é o
  conhecimento que você usa; acertar vira espetáculo; regras que se somam.

## Estado atual

- Direção mais promissora: **"Rumo à Receita"** — objetivo final, tabuleiro
  sempre cheio, descobrir receitas juntando vizinhos, toques limitados,
  combinação errada explode e traz peças úteis. Protótipo em
  `prototipos/rumo-a-receita.html` (branch `spike/quebra-cabeca`).
- Pendências: quase todo par de elementos base reage (explosões quase nunca
  acontecem); testar vidas por fase (❤️❤️❤️); calibrar dificuldade.
- O jogo completo do Plano 1 (troca de peças) está no `main`; arte, telas,
  receitas e salvamento serão reaproveitados.
