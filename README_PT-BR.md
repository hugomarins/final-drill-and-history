# Final Drill & History

[English](README.md) | [Español](README_ES.md)

Este plugin estende as funcionalidades do plugin oficial do RemNote **History** com duas ferramentas de estudo poderosas: um histórico de flashcards revisados e uma fila de "Final Drill" (Prática Final) para focar em material difícil.

## Funcionalidades

### 1. Histórico de Rems Visitados
- **O que faz:** Registra um histórico cronológico dos Rems que você navegou no Editor.
- **Por que usar:** Volte rapidamente para documentos em que você estava trabalhando sem perder seu lugar.
- **Interação:** Você pode expandir e editar o Rem diretamente na barra lateral direita.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/rem-history-editing.gif)

### 2. Histórico de Flashcards
- **O que faz:** Registra o histórico cronológico dos Rems associados aos flashcards que você acabou de ver na Fila de Flashcards.
- **Por que usar:** Se você quiser verificar o contexto ou editar um flashcard que acabou de revisar, pode encontrá-lo facilmente aqui sem interromper o fluxo da sua sessão.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/flashcard-history.png)

### 3. Final Drill
- **O que faz:** Implementa uma fila de "Prática Final" inspirada no SuperMemo.
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

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill.png)

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill-and-history.gif)

## Como Usar

1. **Abra a Barra Lateral Direita**: O plugin instala três widgets na barra lateral direita.
2. **Aba Histórico de Rem**:
   - Navegue pela sua base de conhecimento como de costume.
   - Clique nos itens da lista para voltar a eles.
3. **Aba Histórico de Flashcards**:
   - Comece uma fila de flashcards. À medida que você classifica os cartões, eles aparecerão nesta lista.
   - Clique em um rem para abri-lo no editor principal.
4. **Aba Final Drill**:
   - Se você classificar um cartão como "Esqueci" ou "Difícil" durante sua fila regular (ou em qualquer outro lugar), um emblema vermelho aparecerá nesta aba indicando que há cartões pendentes.
   - Abra a aba para praticar esses cartões específicos.
   - A fila será limpa automaticamente à medida que você dominar os cartões (classifique-os como Bom/Fácil).

## Desenvolvedores

Este plugin é um fork do plugin oficial RemNote History, aprimorado com ouvintes de eventos de Fila e implementação de armazenamento sincronizado para a lógica do Final Drill.

Se você estiver interessado em criar seus próprios plugins, confira a documentação oficial, guias e tutoriais no [Site de Plugins do RemNote](https://plugins.remnote.com/).

## Changelog

### v. 0.1.3 06 de Janeiro de 2026

- **Melhorias no Final Drill:**
    - Adicionado um botão "Limpar Fila" para esvaziar facilmente a fila de prática.
    - Adicionado um aviso de "Itens Antigos" para ajudar a identificar e limpar itens obsoletos (adicionados há > 7 dias).
    - Adicionada uma nova configuração para ajustar o "Limite de Itens Antigos" (padrão: 7 dias).

### v. 0.0.2 05 de Janeiro de 2026

- As funcionalidades do plugin (Histórico de Rem, Histórico de Flashcards e Final Drill) agora reconhecem a Base de Conhecimento (você pode usar múltiplas KBs, e os widgets mostrarão os dados apenas da KB selecionada atual).

### v. 0.0.1 04 de Janeiro de 2026

- Lançamento inicial.
