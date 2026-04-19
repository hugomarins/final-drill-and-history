# Historial, Panel de Colas y Práctica de Maestría (Mastery Drill)

🇬🇧 [English](README.md) | 🇧🇷 [Português Brasileiro](README_PT-BR.md)

---

> ## ⚠️ Aviso de Depreciación — Los usuarios de Incremental Everything deben leer esto
>
> Todas las funciones de este complemento han sido **totalmente integradas en el complemento [Incremental Everything](https://www.remnote.com/plugins/incremental-everything)** a partir de la v0.2.182. Este complemento independiente **ya no recibirá mantenimiento ni actualizaciones**.
>
> Si utilizas Incremental Everything, deberías migrar y desinstalar este complemento. La integración incluye mejoras adicionales no disponibles aquí, incluyendo navegación por teclado y atribución de respuesta (grading) via teclado para el componente Mastery Drill, manejo de prioridades, historial de flashcards consciente de grupos (clusters), el seguimiento del Mastery Drill por hermano (sibling) y el recuento de tarjetas de colas practicadas por hermano.
>
> ### Pasos de Migración
>
> 1. **Activa *Skip Mastery Drill* en los ajustes de IE y recarga RemNote.** Esto desactiva el drill de IE por completo, evitando entradas duplicadas en la paleta de comandos y el rastreo doble de AGAIN/HARD mientras ambos complementos coexisten.
> 2. **Completa tu cola de Mastery Drill en este complemento** *(opcional — omítelo si no te importa perder los elementos pendientes; se volverán a llenar en IE de forma natural).*
> 3. **Exporta tu historial de Practiced Queues** desde la pestaña lateral *Practiced Queues History* en este complemento.
> 4. **Desinstala este complemento** (Ajustes de RemNote → Plugins).
> 5. **Desactiva *Skip Mastery Drill* en los ajustes de IE y recarga RemNote.**
> 6. **Importa tu historial de Practiced Queues** en la pestaña lateral *Practiced Queues History* de IE. Las sesiones duplicadas se omitirán automáticamente.
>
> El Historial de Flashcards (Flashcard History) y el Historial de Rems Visitados (Visited Rem History) no pueden ser migrados; Incremental Everything ha estado construyendo sus propias copias desde que se instaló. Consulta la [guía completa de migración](https://github.com/hugomarins/incremental-everything/wiki/History-Queue-Dashboard-and-Mastery-Drill#migrating-from-the-standalone-plugin) para más detalles.

---

Este complemento amplía las capacidades de RemNote con un poderoso conjunto de herramientas de historial y práctica. Cuenta con un **Panel de Sesión en Vivo** para métricas de estudio en tiempo real (velocidad, retención, edad de la tarjeta), un **Historial de Colas Practicadas** para rastrear sus sesiones a lo largo del tiempo, un **Historial de Flashcards** para encontrar y editar rápidamente tarjetas revisadas recientemente, un **Historial de Rems Visitados** para rastrear su navegación en la base de conocimientos, y una cola de **Práctica de Maestría** (Mastery Drill) para enfocarse en material difícil.

## Características

### 1. Historial de Rems Visitados
- **Qué hace:** Registra un historial cronológico de los Rems a los que has navegado en el Editor.
- **Por qué usarlo:** Vuelve rápidamente a los documentos en los que estabas trabajando sin perder tu lugar.
- **Interacción:** Puedes expandir y editar el Rem directamente en la barra lateral derecha.
- **Búsqueda:** Incluye una barra de búsqueda para filtrar instantáneamente tu historial. Soporta consultas de múltiples palabras (ej. "Examen Biología") y búsqueda profunda de texto en todos los elementos registrados.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/rem-history-editing.gif)

### 2. Historial de Flashcards
- **Qué hace:** Registra el historial cronológico de los Rems asociados con las tarjetas que acabas de ver en la Cola de Flashcards.
- **Por qué usarlo:** Si quieres verificar el contexto o editar una tarjeta que acabas de revisar, puedes encontrarla fácilmente aquí sin interrumpir el flujo de tu sesión.
- **Interacción:** Hacer clic en una tarjeta abrirá el rem en el Editor.
- **Búsqueda:** Encuentra sin esfuerzo una tarjeta que practicaste hace momentos o días. La búsqueda verifica tanto el frente (pregunta) como el reverso (respuesta/contexto) de tus tarjetas.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/flashcard-history.png)

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/filter.gif)

### 3. Histórico de Colas Practicadas
- **Qué hace:** Rastrea tus sesiones de práctica y métricas.
- **Panel en Vivo:** Muestra métricas en tiempo real para tu sesión de cola activa, incluyendo velocidad actual, tasa de retención y la edad de la tarjeta exacta que estás revisando.
- **Métricas Recopiladas:**
    - Tiempo total de estudio.
    - **Tasa de Retención:** Rastrea tu rendimiento (Recordado vs. Olvidado) y porcentaje.
    - **Análisis de Velocidad:** Tarjetas por minuto (CPM) y segundos por tarjeta, con indicadores visuales de velocidad.
    - **Resumen de Sesiones:** Un tablero que agrega tus estadísticas para Hoy, Ayer, Esta Semana, Semana Pasada, y más.
    - Número de tarjetas revisadas y tiempo dedicado a ellas.
    - Número de "Rems Incrementales" analizados y tiempo dedicado a ellos.
- **Por qué usarlo:** Obtén información sobre tus hábitos de estudio y monitorea tu uso de herramientas de lectura incremental.
- **Interacción:** Hacer clic en una sesión abrirá el documento en el Editor, para que puedas revisar el material nuevamente.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/queue-history.png)

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/queue-history-live.png)

### 4. Mastery Drill
- **Qué hace:** Implementa una cola de "Práctica de Maestría" (Mastery Drill) inspirada en el "Final Drill" de SuperMemo, accesible usando el comando `Mastery Drill` en la Omnibar o desde el widget del extremo de la barra lateral izquierda.
- **Cómo funciona:**
    - Cualquier tarjeta que califiques como **Olvidé (Forgot)** o **Difícil (Hard)** se agrega automáticamente a la cola de Mastery Drill.
      - **Olvidé** generalmente ya tiene un paso de reaprendizaje. Si realizas este paso de reaprendizaje con éxito, la tarjeta se borrará de la cola de Mastery Drill; si no, hacerlo en el Mastery Drill será lo mismo que hacerlo fuera de él. El propósito de tener estas tarjetas en la práctica es asegurar que cumplas con el paso de reaprendizaje (en caso de que usualmente hagas tarjetas en colas de documentos en lugar de en la cola global).
      - **Difícil** es lo que marca la verdadera diferencia. Practicar estas tarjetas es como si estuvieras revisando antes de tiempo; los algoritmos (especialmente FSRS) tienen esto en cuenta, y el intervalo generado será prácticamente el mismo que el ya asignado. El propósito de tenerlas en la práctica es asegurar que has elevado la retuperabilidad cerca del 100% (el mismo propósito del paso de reaprendizaje para ítems olvidados).
      - A diferencia de _SuperMemo_, estas revisiones se registrarán en tu historial de repeticiones.
    - Estas tarjetas permanecen en esta cola separada hasta que las califiques como **Bien (Good)** o **Fácil (Easy)** dentro del widget de Mastery Drill.
- **Por qué usarlo:** Úsalo para revisar solo los elementos con los que tuviste dificultades recientemente, asegurando que los domines. Trabajar en el modo de solo dificultad pone a tu cerebro en un nivel de alerta de emergencia. Abordas las repeticiones de manera diferente si se espera un fallo en el recuerdo. A veces, esto es suficiente para entender material más difícil y dominarlo gradualmente. Este modo está diseñado para asegurar que has elevado la recuperabilidad del material más difícil cerca del 100% (en otras palabras, que has asimilado el contenido y lo conoces).
- **¿Tengo que usarlo?:** Ten en cuenta que esta es una etapa opcional del proceso de aprendizaje. No usarlo no traerá consecuencias negativas para tu proceso de aprendizaje, ya que en la próxima repetición programada, serás evaluado nuevamente, y los fallos serán tratados en consecuencia por el algoritmo. Pero usar la práctica no costará mucho y aumentará las posibilidades de éxito en las repeticiones subsiguientes.
- **Gestión de la Cola:**
    - **Ítems Antiguos (Clear Old):** Si los ítems permanecen en la cola por mucho tiempo (por defecto 7 días), aparecerá una advertencia. Puedes borrar estos ítems obsoletos con un solo clic para mantener tu sesión de práctica enfocada en material fresco. El umbral se puede configurar en los ajustes del complemento.
    - **Borrar Cola (Clear Queue):** Un botón "Borrar Cola" te permite vaciar la cola de Mastery Drill en cualquier momento si quieres empezar de nuevo o simplemente limpiar.
- **Limitaciones:** no es respondente a atajos de teclado, y no tiene acceso a los botones Editar / Previsualizar. Como una solución alternativa, un Editor UI es accesible por botones (como alternativas, un botón "Editar Después" para eliminar la tarjeta de la cola de Mastery Drill y agregar el powerup Edit Later nativo de RemNote, y un botón "Ir al Rem" para saltar al Rem en el Editor RemNote nativo).

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill.png)

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill-editor.png)

## Cómo Usar

1. **Abrir la Barra Lateral Derecha**: El complemento instala tres widgets en la barra lateral derecha.
2. **Pestaña Historial de Rem**:
   - Navega a través de tu base de conocimientos como de costumbre.
   - Haz clic en los ítems de la lista para volver a ellos.
3. **Pestaña Historial de Flashcards**:
   - Inicia una cola de flashcards. A medida que califiques las tarjetas, aparecerán en esta lista.
   - Haz clic en un rem para abrirlo en el editor principal.
4. **Pestaña Historial de Colas Practicadas**: 
   - ¿Quieres volver a las colas que empezaste pero no pudiste terminar? Haz clic en el nombre de la cola para volver a ella.
   - Supervisa aquí las estadísticas de tus colas practicadas.
5. **Comando Mastery Drill**: 
   - Si calificas una tarjeta como "Olvidé" o "Difícil" durante tu cola regular (o en cualquier otro lugar), aparecerá una insignia roja en esta pestaña indicando que hay tarjetas pendientes.
   - Usa el comando `Mastery Drill` en la Omnibar para practicar estas tarjetas específicas (o presiona el botón del widget que aparece de vez en cuando en el extremo de la barra lateral izquierda).
   - La cola se vaciará automáticamente a medida que domines las tarjetas (califícalas como Bien/Fácil).
   ![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill-notification.png)

   ![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill-command.png)

## Registro de Cambios (Changelog)

### v. 0.0.36 18 de Abril de 2026

- **Aviso de Depreciación:** Este plugin está ahora depreciado. Todas las funciones han sido integradas totalmente en el plugin [Incremental Everything](https://www.remnote.com/plugins/incremental-everything) a partir de la v0.2.182. Se recomienda a los usuarios migrar y desinstalar esta versión independiente. Por favor, consulte el aviso en la parte superior de este documento para los pasos de migración.

### v. 0.0.34 19 de Marzo de 2026

- **Corrección de Error (Mastery Drill):** Se corrigió un cierre inesperado (crash) que podía ocurrir al volver a abrir el Mastery Drill después de una sesión anterior. La causa raíz era un problema del ciclo de vida de React: el componente Queue se montaba inmediatamente con una lista de tarjetas vacía (antes de que se cargaran los datos asíncronos de la Base de Conocimientos) y luego se volvía a montar una vez que llegaban los datos reales. Este doble montaje dejaba a la primera instancia de Queue con operaciones asíncronas en curso que intentaban actualizar el estado después de que el componente ya se había desmontado, causando el error *"Transaction failed: popCard – Sub queue Rem not loaded"* en la siguiente apertura. La solución retrasa el renderizado de la Queue hasta que se confirmen los datos de la KB, de modo que la Queue solo se monta una vez con los datos completos.

### v. 0.0.33 18 de Marzo de 2026

- **Nueva Funcionalidad (Sesiones Practicadas):** Añadida la función de **Exportar e Importar**. Ahora puedes hacer una copia de seguridad (backup) de tu historial de sesiones de práctica (de todas las Bases de Conocimiento) en un archivo JSON local e importarlo nuevamente en cualquier momento (las sesiones duplicadas se omiten automáticamente).
- **Mejora:** Implementada una configuración de **Límite de Tiempo de Respuesta de Flashcards** (por defecto: 180s) que refleja el comportamiento nativo de RemNote. Si te alejas de tu dispositivo con una tarjeta abierta, el tiempo de estudio registrado se limitará, manteniendo así la precisión de tus métricas de velocidad y tiempo total.

### v. 0.0.32 10 de Marzo de 2026

- Se aplicó una corrección al archivo webpack.config.js para empaquetar snippet.css y App.css en sus distribuciones, lo que debería evitar el error 403 (Prohibido).

### v. 0.0.31 09 de Marzo de 2026

- **Corrección de Error:** Se corrigió un problema causado por elementos de audio u otros medios complejos dentro de las tarjetas que generaban el error "Invalid input", deteniendo la ejecución del script.

### v. 0.0.28 09 de Febrero de 2026

- **Corrección de Error:** Se corrigió el cuadro "Tarjeta Anterior" que mostraba datos obsoletos cuando la tarjeta actual es "Nueva" (sin historial).
- **Mejora:** "Edad de la Tarjeta" e intervalos ahora muestran horas y minutos para duraciones menores a 24 horas (ej: "4h", "30min") en lugar de "Nuevo".
- **Cambio de Nombre:** "Final Drill" ha sido renombrado a **Mastery Drill** para reflejar mejor su propósito y evitar confusiones con otras herramientas.

### v. 0.0.27 08 de Febrero de 2026

- **Corrección de Error:** Se corrigieron los botones **Borrar Cola (Clear Queue)** y **Borrar Antiguos (Clear Old)** que no mostraban los cuadros de diálogo de confirmación.

### v. 0.0.25 2 de Febrero de 2026

- **Mejora:** Se mejoró la visualización de tarjetas en la Sesión en Vivo para mostrar el **intervalo** (tiempo hasta la próxima revisión) tanto para la tarjeta actual como para la anterior. Para la tarjeta anterior, también se muestra la **cobertura total** (período de tiempo desde la creación de la tarjeta hasta la próxima fecha de revisión), proporcionando información sobre tu progreso de aprendizaje.
- **Nueva Métrica:** Se añadió una métrica de **Costo** (minutos por año) al tablero de la Sesión en Vivo.
    - **Caja de Tarjeta Anterior:** Muestra el costo como `Tiempo Total (min) / Cobertura (años)`.
    - **Caja de Tarjeta Actual:** Muestra el costo como `Tiempo Total (min) / Edad de la Tarjeta (años)`.
- **Mejora de UI:** Las métricas en la caja de la Tarjeta Actual ahora se ajustan naturalmente para caber en el espacio disponible.

### v. 0.0.23 29 de Enero de 2026

- **Mejora:** Se aumentó el límite de texto de búsqueda del historial de flashcards de 200 a 1000 caracteres por lado (frente/reverso), mejorando significativamente la cobertura de búsqueda para flashcards más largos.

### v. 0.0.22 28 de Enero de 2026

- **Corrección de Error:** Se corrigió un problema donde las tarjetas omitidas (`TOO_EARLY`) se agregaban incorrectamente a la cola de Final Drill. Ahora solo se agregan las tarjetas calificadas explícitamente como **Olvidé (Again)** o **Difícil (Hard)**.
- **Nueva Funcionalidad:** Se agregó un botón **Editar Después (Edit Later)** al widget de Final Drill (entre "Ir al Rem" y "Editar Anterior"). Al hacer clic, marca el Rem del cartón actual con el powerup "Editar Después" y lo elimina de la cola de prática, permitiéndote diferir la edición sin perder el seguimiento.

### v. 0.0.21 21 de Enero de 2026

- **Corrección de Error:** Se redujo el número máximo de flashcards almacenadas en el historial a 999 para evitar problemas de rendimiento. 
- **Funcionalidad:** Se añadió un comando de depuración para limpiar el historial de flashcards en caso de que el usuario tenga problemas de sincronización ("Debug: Clear Flashcard History").

### v. 0.0.20 21 de Enero de 2026

- **Corrección de Error:** Implementada la inicialización de sesión perezosa en `index.tsx` para manejar eventos QueueEnter perdidos en iOS.

### v. 0.0.19 20 de Enero de 2026

- **Corrección de Error:** Se arregló un problema donde el widget de Final Drill mostraba incorrectamente "0 tarjetas" o "Terminado" incluso cuando quedaban tarjetas en la cola.

### v. 0.0.18 18 de Enero de 2026

- **Corrección de Error:** Las estadísticas de "Tarjeta Anterior" en el panel en vivo ahora reflejan el estado final de la tarjeta después de ser revisada, incluyendo el tiempo invertido y el incremento en el recuento de repeticiones.

### v. 0.0.17 17 de Enero de 2026

- **Corrección de Error:** Se resolvió un problema donde el Final Drill registraba una sesión separada por cada tarjeta revisada, en lugar de una sesión continua.

### v. 0.0.16 10 de Enero de 2026

- **Corrección de Error:** Se resolvió un problema donde las sesiones de práctica no se registraban al navegar fuera de la cola (ej: haciendo clic en un enlace o abriendo un Rem) en lugar de usar el botón de cerrar.

### v. 0.0.12 09 de Enero de 2026

- **Actualización de Colas Practicadas:**
    - **Panel de Sesión en Vivo:** Una nueva vista en tiempo real en la parte superior del widget que muestra el progreso de tu sesión actual.
    - **Resumen del Historial:** Una tabla completa que muestra estadísticas agregadas (Tiempo, Tarjetas, Velocidad, Retención) para Hoy, Ayer, Semana Pasada, etc.
    - **Nuevas Métricas:**
        - **Tasa de Retención:** Mira exactamente cuántas tarjetas recordaste vs. olvidaste.
        - **Tarjetas Por Minuto (CPM):** Métrica de velocidad codificada por colores para rastrear tu velocidad.
        - **Edad de la Tarjeta:** (Solo Vista en Vivo) Mira la edad (tiempo desde la creación) de la tarjeta que estás revisando actualmente.

### v. 0.0.8 07 de Enero de 2026

- **Final Drill:** Ahora se muestra en una ventana popup. Limitaciones: no es respondente a atajos de teclado, y no tiene acceso a los botones Editar / Previsualizar. Como una solución alternativa, un Editor UI es accesible por botones (como alternativa, un botón "Ir al Rem" para saltar al Rem en el Editor RemNote nativo).

### v. 0.0.7 07 de Enero de 2026

- **Filtro de Búsqueda:** Se agregó una potente barra de búsqueda al "Historial de Rems Visitados" y al "Historial de Flashcards".
    - Filtra elementos del historial instantáneamente por texto.
    - Soporta búsquedas de múltiples palabras (prioriza coincidencias exactas).
    - **Contexto de Flashcard:** La búsqueda incluye el **Texto Trasero** (contenido) de tus flashcards, facilitando encontrar elementos basados en su respuesta o contexto.
    - **Relleno Automático (Backfill):** Los elementos existentes del historial se actualizan automáticamente en segundo plano para incluir texto buscable.

### v. 0.1.6 07 de Enero de 2026

- **Mejoras en Final Drill:**
    - Se solucionó un error donde la cola de Final Drill podía colisionar con la cola principal.

### v. 0.1.4 06 de Enero de 2026

- **Histórico de Colas Practicadas:**
    - Implementado seguimiento de métricas, distinguiendo entre Tarjetas Regulares y Rems Incrementales.
    - Implementado tablero para ver desgloses detallados de recuentos y tiempos de tarjetas vs IncRems para cada sesión.

### v. 0.1.3 06 de Enero de 2026

- **Mejoras en Final Drill:**
    - Se agregó un botón "Borrar Cola" para vaciar fácilmente la cola de práctica.
    - Se agregó una advertencia de "Ítems Antiguos" para ayudar a identificar y borrar ítems obsoletos (agregados hace > 7 días).
    - Se agregó una nueva configuración para ajustar el "Umbral de Ítems Antiguos" (predeterminado: 7 días).

### v. 0.0.2 05 de Enero de 2026

- Las características del complemento (Historial de Rem, Historial de Flashcards y Final Drill) ahora reconocen la Base de Conocimientos (puedes usar múltiples KBs, y los widgets mostrarán los datos solo de la KB seleccionada actual).

### v. 0.0.1 04 de Enero de 2026

- Lanzamiento inicial.
