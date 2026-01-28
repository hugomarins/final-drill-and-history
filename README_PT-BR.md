# Final Drill & History

🇬🇧 [English](README.md) | 🇪🇸 [Español](README_ES.md)

Este plugin estende as funcionalidades do plugin oficial do RemNote **History** com duas ferramentas de estudo poderosas: um histórico de flashcards revisados e uma fila de "Final Drill" (Prática Final) para focar em material difícil.

## Funcionalidades

### 1. Histórico de Rems Visitados
- **O que faz:** Registra um histórico cronológico dos Rems que você navegou no Editor.
- **Por que usar:** Volte rapidamente para documentos em que você estava trabalhando sem perder seu lugar.
- **Interação:** Você pode expandir e editar o Rem diretamente na barra lateral direita.
- **Busca:** Inclui uma barra de busca para filtrar instantaneamente seu histórico. Suporta consultas de múltiplas palavras (ex: "Prova Biologia") e busca profunda de texto em todos os itens registrados.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/rem-history-editing.gif)

### 2. Histórico de Flashcards
- **O que faz:** Registra o histórico cronológico dos Rems associados aos flashcards que você acabou de ver na Fila de Flashcards.
- **Por que usar:** Se você quiser verificar o contexto ou editar um flashcard que acabou de revisar, pode encontrá-lo facilmente aqui sem interromper o fluxo da sua sessão.
- **Interação:** Clicar em um flashcard abrirá o rem no Editor.
- **Busca:** Encontre sem esforço um cartão que você praticou momentos ou dias atrás. A busca verifica tanto a frente (pergunta) quanto o verso (resposta/contexto) dos seus cartões.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/flashcard-history.png)

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/filter.gif)

### 3. Histórico de Sessões Praticadas (Practiced Queues History)
- **O que faz:** Rastreia suas sessões de prática e métricas.
- **Painel ao Vivo:** Exibe métricas em tempo real para sua sessão de fila ativa atual, incluindo velocidade atual, taxa de retenção e a idade exata do cartão que você está revisando.
- **Métricas Coletadas:**
    - Tempo total de estudo.
    - **Taxa de Retenção:** Acompanhe seu desempenho (Lembrado vs. Esquecido) e porcentagem.
    - **Análise de Velocidade:** Cartões por minuto (CPM) e segundos por cartão, com indicadores visuais de velocidade.
    - **Resumo das Sessões:** Um painel agregando suas estatísticas para Hoje, Ontem, Esta Semana, Semana Passada e mais.
    - Número de flashcards revisados e tempo gasto neles.
    - Número de "Rems Incrementais" processados e tempo gasto neles.
- **Por que usar:** Obtenha insights sobre seus hábitos de estudo e monitore seu uso de ferramentas de leitura incremental.
- **Interação:** Clicar em uma sessão abrirá o documento no Editor, para que você possa revisar o material novamente.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/queue-history.png)

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/queue-history-live.png)

### 4. Final Drill
- **O que faz:** Implementa uma fila de "Prática Final" inspirada no SuperMemo, acessível pelo comando `Final Drill` na Omnibar ou por um botão no widget que aparece ocasionalmentena parte inferior da barra lateral esquerda.
- **Como funciona:**
    - Qualquer flashcard que você classificar como **Esqueci (Forgot)** ou **Difícil (Hard)** é automaticamente adicionado à fila do Final Drill.
      - **Esqueci** geralmente já possui uma etapa de reaprendizagem. Se você realizar essa etapa de reaprendizagem com sucesso, o cartão será removido da fila do Final Drill; se não, fazê-lo no Final Drill será o mesmo que fazê-lo fora dele. O objetivo de ter esses cartões na prática é garantir que você cumpra a etapa de reaprendizagem (caso você geralmente faça flashcards em filas de documentos em vez da fila global).
      - **Difícil** é o que traz a verdadeira diferença. Praticar esses cartões é como se você estivesse revisando antecipadamente; algoritmos (especialmente FSRS) levam isso em conta, e o intervalo gerado será praticamente o mesmo que o já atribuído. O objetivo de tê-los na prática é garantir que você elevou a recuperabilidade para perto de 100% (o mesmo objetivo da etapa de reaprendizagem para itens esquecidos).
      - Ao contrário do _SuperMemo_, essas revisões serão registradas no seu histórico de repetições.
    - Esses cartões permanecem nesta fila separada até que você os classifique como **Bom (Good)** ou **Fácil (Easy)** dentro do widget Final Drill.
- **Por que usar:** Use isso no final do seu dia de aprendizado (ou sempre que estiver com vontade) para revisar apenas os itens com os quais você teve dificuldades recentemente, garantindo que você os domine antes de terminar sua sessão. Ele foi projetado para garantir que você elevou a recuperabilidade do material mais difícil para perto de 100% (em outras palavras, que você enraizou o conteúdo e o conhece).
- **Eu tenho que usar isso?:** Tenha em mente que esta é uma etapa opcional do processo de aprendizagem. Não usá-lo não trará consequências negativas para o seu processo de aprendizagem, pois na próxima repetição agendada, você será testado novamente, e as falhas serão tratadas de acordo pelo algoritmo. Mas usar a prática não custará muito e aumentará as chances de sucesso nas repetições subsequentes.
- **Gerenciamento da Fila:**
    - **Itens Antigos (Clear Old):** Se os itens permanecerem na fila por muito tempo (padrão 7 dias), um aviso aparecerá. Você pode limpar esses itens obsoletos com um único clique para manter sua sessão de prática focada em material fresco. O limite pode ser configurado nas configurações do plugin.
    - **Limpar Fila (Clear Queue):** Um botão "Limpar Fila" permite esvaziar a fila do Final Drill a qualquer momento se você quiser começar do zero ou simplesmente organizar.
- **Limitações:** não responde a atalhos de teclado, e não tem acesso aos botões Editar / Pré-visualizar. Como uma solução alternativa, uma interface de edição é acessível por botões (como alternativas, um botão "Editar Depois" remover o cartão da fila do Final Drill e adicionar o Edit Later powerup nativo do RemNote, e um botão "Ir para Rem" para pular ao Rem no Editor nativo do RemNote).

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill.png)

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill-editor.png)

## Como Usar

1. **Abra a Barra Lateral Direita**: O plugin instala três widgets na barra lateral direita.
2. **Aba Histórico de Rem**:
   - Navegue pela sua base de conhecimento como de costume.
   - Clique nos itens da lista para voltar a eles.
3. **Aba Histórico de Flashcards**:
   - Comece uma fila de flashcards. À medida que você classifica os cartões, eles aparecerão nesta lista.
   - Clique em um rem para abri-lo no editor principal.
4. **Aba Histórico de Sessões Praticadas**:
   - Quer voltar a uma fila que você começou mas não terminou? Clique no nome da fila para navegar de volta para ela.
   - Monitore aqui as estatísticas de suas filas praticadas.
5.   **Comando Final Drill**:
   - Se você classificar um cartão como "Esqueci" ou "Difícil" durante sua fila regular (ou em qualquer outro lugar), um emblema vermelho aparecerá nesta aba indicando que há cartões pendentes.
   - Use o comando `Final Drill` na Omnibar para praticar esses cartões específicos.
   - A fila será limpa automaticamente à medida que você dominar os cartões (classifique-os como Bom/Fácil).
   ![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill-notification.png)

   ![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill-command.png)

## Changelog

### v. 0.0.22 28 de Janeiro de 2026

- **Correção de Bug:** Corrigido um problema onde cartões pulados (`TOO_EARLY`) eram incorretamente adicionados à fila do Final Drill. Agora apenas cartões explicitamente classificados como **Esqueci (Again)** ou **Difícil (Hard)** são adicionados.
- **Nova Funcionalidade:** Adicionado um botão **Editar Depois (Edit Later)** ao widget Final Drill (entre "Ir para Rem" e "Editar Anterior"). Ao clicar, marca o Rem do cartão atual com o powerup "Editar Depois" e o remove da fila de prática, permitindo adiar a edição sem perder o acompanhamento.

### v. 0.0.21 21 de Janeiro de 2026

- **Correção de Bug:** Reduzido o número máximo de flashcards armazenados no histórico para 999 para evitar problemas de desempenho. 
- **Funcionalidade:** Adicionado um comando de depuração para limpar o histórico de flashcards caso o usuário enfrente problemas de sincronização ("Debug: Clear Flashcard History").

### v. 0.0.20 21 de Janeiro de 2026

- **Correção de Bug:** Implementada inicialização de sessão "preguiçosa" no `index.tsx` para lidar com eventos QueueEnter não disparando no iOS.

### v. 0.0.19 20 de Janeiro de 2026

- **Correção de Bug:** Corrigido um problema onde o widget Final Drill mostrava incorretamente "0 cartões" ou "Terminado" mesmo quando havia cartões restantes na fila.

### v. 0.0.18 18 de Janeiro de 2026

- **Correção de Bug:** As estatísticas do "Cartão Anterior" no painel ao vivo agora refletem o estado final do cartão após ser revisado, incluindo o tempo gasto e o incremento na contagem de repetição.

### v. 0.0.17 17 de Janeiro de 2026

- **Correção de Bug:** Resolvido um problema onde o Final Drill gravava uma sessão separada para cada cartão revisado, em vez de uma única sessão contínua.

### v. 0.0.16 10 de Janeiro de 2026

- **Correção de Bug:** Resolvido um problema onde sessões de prática não eram gravadas ao navegar para fora da fila (ex: clicando em um link ou abrindo um Rem) ao invés de usar o botão de fechar.

### v. 0.0.12 09 de Janeiro de 2026

- **Atualização de Filas Praticadas:**
    - **Painel de Sessão ao Vivo:** Uma nova visualização em tempo real no topo do widget mostrando o progresso da sua sessão atual.
    - **Resumo do Histórico:** Uma tabela abrangente mostrando estatísticas agregadas (Tempo, Cartões, Velocidade, Retenção) para Hoje, Ontem, Semana Passada, etc.
    - **Novas Métricas:**
        - **Taxa de Retenção:** Veja exatamente quantos cartões você lembrou vs. esqueceu.
        - **Cartões Por Minuto (CPM):** Métrica de velocidade codificada por cores para rastrear sua velocidade.
        - **Idade do Cartão:** (Apenas Visualização ao Vivo) Veja a idade (tempo desde a criação) do cartão que você está revisando atualmente.

### v. 0.0.8 07 de Janeiro de 2026

- **Final Drill:** Agora é mostrado em uma janela popup. Limitações: não responde a atalhos de teclado, e não tem acesso aos botões Editar / Pré-visualizar. Como uma solução alternativa, uma interface de edição é acessível por botões (como alternativa, um botão "Ir para Rem" para pular ao Rem no Editor RemNote nativo). 

### v. 0.0.7 07 de Janeiro de 2026

- **Filtro de Busca:** Adicionada uma potente barra de busca ao "Histórico de Rems Visitados" e ao "Histórico de Flashcards".
    - Filtre itens do histórico instantaneamente por texto.
    - Suporta buscas de múltiplas palavras (prioriza correspondências exatas).
    - **Contexto do Flashcard:** A busca inclui o **Texto do Verso** (conteúdo) dos seus flashcards, facilitando encontrar itens baseados em sua resposta ou contexto.
    - **Preenchimento Retroativo (Backfill):** Itens existentes do histórico são atualizados automaticamente em segundo plano para incluir texto pesquisável.

### v. 0.1.6 07 de Janeiro de 2026

- **Melhorias no Final Drill:**
    - Solucionado um bug onde a fila de Final Drill podia colidir com a fila principal.

### v. 0.1.4 06 de Janeiro de 2026

- **Histórico de Sessões Praticadas (Practiced Queues History):**
    - Implementado rastreamento de métricas, distinguindo entre Flashcards Regulares e Rems Incrementais.
    - Implementado painel para visualizar detalhadamente contagens e tempos de cartões vs IncRems para cada sessão.

### v. 0.1.3 06 de Janeiro de 2026

- **Melhorias no Final Drill:**
    - Adicionado um botão "Limpar Fila" para esvaziar facilmente a fila de prática.
    - Adicionado um aviso de "Itens Antigos" para ajudar a identificar e limpar itens obsoletos (adicionados há > 7 dias).
    - Adicionada uma nova configuração para ajustar o "Limite de Itens Antigos" (padrão: 7 dias).

### v. 0.0.2 05 de Janeiro de 2026

- As funcionalidades do plugin (Histórico de Rem, Histórico de Flashcards e Final Drill) agora reconhecem a Base de Conhecimento (você pode usar múltiplas KBs, e os widgets mostrarão os dados apenas da KB selecionada atual).

### v. 0.0.1 04 de Janeiro de 2026

- Lançamento inicial.
