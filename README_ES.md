# Final Drill & History

[English](README.md) | [Português Brasileiro](README_PT-BR.md)

Este complemento amplía la funcionalidad del plugin oficial **History** de RemNote con dos poderosas herramientas de estudio: un historial de tarjetas revisadas y una cola de "Final Drill" (Práctica Final) para enfocarse en material difícil.

## Características

### 1. Historial de Rems Visitados
- **Qué hace:** Registra un historial cronológico de los Rems a los que has navegado en el Editor.
- **Por qué usarlo:** Vuelve rápidamente a los documentos en los que estabas trabajando sin perder tu lugar.
- **Interacción:** Puedes expandir y editar el Rem directamente en la barra lateral derecha.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/rem-history-editing.gif)

### 2. Historial de Flashcards
- **Qué hace:** Registra el historial cronológico de los Rems asociados con las tarjetas que acabas de ver en la Cola de Flashcards.
- **Por qué usarlo:** Si quieres verificar el contexto o editar una tarjeta que acabas de revisar, puedes encontrarla fácilmente aquí sin interrumpir el flujo de tu sesión.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/flashcard-history.png)

### 3. Final Drill
- **Qué hace:** Implementa una cola de "Práctica Final" inspirada en SuperMemo.
- **Cómo funciona:**
    - Cualquier tarjeta que califiques como **Olvidé (Forgot)** o **Difícil (Hard)** se agrega automáticamente a la cola de Final Drill.
      - **Olvidé** generalmente ya tiene un paso de reaprendizaje. Si realizas este paso de reaprendizaje con éxito, la tarjeta se borrará de la cola de Final Drill; si no, hacerlo en el Final Drill será lo mismo que hacerlo fuera de él. El propósito de tener estas tarjetas en la práctica es asegurar que cumplas con el paso de reaprendizaje (en caso de que usualmente hagas tarjetas en colas de documentos en lugar de en la cola global).
      - **Difícil** es lo que marca la verdadera diferencia. Practicar estas tarjetas es como si estuvieras revisando antes de tiempo; los algoritmos (especialmente FSRS) tienen esto en cuenta, y el intervalo generado será prácticamente el mismo que el ya asignado. El propósito de tenerlas en la práctica es asegurar que has elevado la retuperabilidad cerca del 100% (el mismo propósito del paso de reaprendizaje para ítems olvidados).
      - A diferencia de _SuperMemo_, estas revisiones se registrarán en tu historial de repeticiones.
    - Estas tarjetas permanecen en esta cola separada hasta que las califiques como **Bien (Good)** o **Fácil (Easy)** dentro del widget de Final Drill.
- **Por qué usarlo:** Úsalo al final de tu día de aprendizaje (o cuando estés de humor) para revisar solo los ítems con los que tuviste dificultades recientemente, asegurando que los domines antes de terminar tu sesión. Está diseñado para asegurar que has elevado la recuperabilidad del material más difícil cerca del 100% (en otras palabras, que has asimilado el contenido y lo conoces).
- **¿Tengo que usarlo?:** Ten en cuenta que esta es una etapa opcional del proceso de aprendizaje. No usarlo no traerá consecuencias negativas para tu proceso de aprendizaje, ya que en la próxima repetición programada, serás evaluado nuevamente, y los fallos serán tratados en consecuencia por el algoritmo. Pero usar la práctica no costará mucho y aumentará las posibilidades de éxito en las repeticiones subsiguientes.
- **Gestión de la Cola:**
    - **Ítems Antiguos (Clear Old):** Si los ítems permanecen en la cola por mucho tiempo (por defecto 7 días), aparecerá una advertencia. Puedes borrar estos ítems obsoletos con un solo clic para mantener tu sesión de práctica enfocada en material fresco. El umbral se puede configurar en los ajustes del complemento.
    - **Borrar Cola (Clear Queue):** Un botón "Borrar Cola" te permite vaciar la cola de Final Drill en cualquier momento si quieres empezar de nuevo o simplemente limpiar.

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill.png)

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill-and-history.gif)

## Cómo Usar

1. **Abrir la Barra Lateral Derecha**: El complemento instala tres widgets en la barra lateral derecha.
2. **Pestaña Historial de Rem**:
   - Navega a través de tu base de conocimientos como de costumbre.
   - Haz clic en los ítems de la lista para volver a ellos.
3. **Pestaña Historial de Flashcards**:
   - Inicia una cola de flashcards. A medida que califiques las tarjetas, aparecerán en esta lista.
   - Haz clic en un rem para abrirlo en el editor principal.
4. **Pestaña Final Drill**:
   - Si calificas una tarjeta como "Olvidé" o "Difícil" durante tu cola regular (o en cualquier otro lugar), aparecerá una insignia roja en esta pestaña indicando que hay tarjetas pendientes.
   - Abre la pestaña para practicar estas tarjetas específicas.
   - La cola se vaciará automáticamente a medida que domines las tarjetas (califícalas como Bien/Fácil).

## Desarrolladores

Este complemento es una bifurcación (fork) del complemento oficial RemNote History, mejorado con escuchas de eventos de Cola e implementación de almacenamiento sincronizado para la lógica de Final Drill.

Si estás interesado en construir tus propios complementos, consulta la documentación oficial, guías y tutoriales en el [Sitio Web de Plugins de RemNote](https://plugins.remnote.com/).

## Registro de Cambios (Changelog)

### v. 0.1.3 06 de Enero de 2026

- **Mejoras en Final Drill:**
    - Se agregó un botón "Borrar Cola" para vaciar fácilmente la cola de práctica.
    - Se agregó una advertencia de "Ítems Antiguos" para ayudar a identificar y borrar ítems obsoletos (agregados hace > 7 días).
    - Se agregó una nueva configuración para ajustar el "Umbral de Ítems Antiguos" (predeterminado: 7 días).

### v. 0.0.2 05 de Enero de 2026

- Las características del complemento (Historial de Rem, Historial de Flashcards y Final Drill) ahora reconocen la Base de Conocimientos (puedes usar múltiples KBs, y los widgets mostrarán los datos solo de la KB seleccionada actual).

### v. 0.0.1 04 de Enero de 2026

- Lanzamiento inicial.
