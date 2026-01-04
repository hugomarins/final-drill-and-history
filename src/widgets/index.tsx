import {
  RemId,
  WidgetLocation,
  declareIndexPlugin,
  ReactRNPlugin,
  AppEvents,
  QueueInteractionScore,
} from "@remnote/plugin-sdk";
import "../style.css";

// Interface for our storage data
interface FlashcardHistoryData {
  key: number;
  remId: RemId;
  cardId: string;
  time: number;
}

async function onActivate(plugin: ReactRNPlugin) {
  // 1. Existing Document History Widget
  await plugin.app.registerWidget(
    "rem_history",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "100%", width: "100%" },
      widgetTabIcon: "https://i.imgur.com/MLaBDJw.png", // Original Icon
    }
  );

  // 2. New Flashcard History Widget (Enhancement 1)
  await plugin.app.registerWidget(
    "flashcard_history",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "100%", width: "100%" },
      widgetTabIcon: "https://cdn-icons-png.flaticon.com/512/9145/9145670.png", // Example Icon: Flashcard
      widgetTabTitle: "Flashcard History",
    }
  );

  // 3. New Final Drill Widget (Enhancement 2)
  await plugin.app.registerWidget(
    "final_drill",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "100%", width: "100%" },
      widgetTabIcon: "https://cdn-icons-png.flaticon.com/512/3534/3534117.png", // Example Icon: Drill/Target
      widgetTabTitle: "Final Drill",
    }
  );

  // --- Event Listeners ---

  // Document History Listener (Existing)
  plugin.event.addListener(
    AppEvents.GlobalOpenRem,
    undefined,
    async (message) => {
      const currentRemId = message.remId as RemId;
      const currentRemData = (await plugin.storage.getSynced("remData")) || [];

      if (currentRemData[0]?.remId != currentRemId) {
        await plugin.storage.setSynced("remData", [
          {
            key: Math.random(),
            remId: currentRemId,
            open: false,
            time: new Date().getTime(),
          },
          ...currentRemData,
        ]);
      }
    }
  );

  // Flashcard Queue Listener (New for Enhancements 1 & 2)
  // AppEvents.QueueCompleteCard fires when a card is rated/finished.
  plugin.event.addListener(
    AppEvents.QueueCompleteCard,
    undefined,
    async (message) => {
      // Extract data from the event. 
      // Note: We cast message to any because the strict type definition might not expose all fields in all SDK versions.
      const { cardId, score } = message as { cardId: string; score: QueueInteractionScore };
      
      if (!cardId) return;

      const card = await plugin.card.findOne(cardId);
      if (!card) return;

      const remId = card.remId;

      // --- Logic for Enhancement 1: Flashcard History ---
      const historyData = (await plugin.storage.getSynced("flashcardHistoryData")) || [];
      // Prevent duplicate consecutive entries
      if (historyData[0]?.cardId !== cardId) {
         await plugin.storage.setSynced("flashcardHistoryData", [
          {
            key: Math.random(),
            remId: remId,
            cardId: cardId,
            time: new Date().getTime(),
          },
          ...historyData.slice(0, 99), // Limit history size
        ]);
      }

      // --- Logic for Enhancement 2: Final Drill ---
      // Get current drill list
      let finalDrillIds = (await plugin.storage.getSynced("finalDrillIds")) || [];
      
      // If score is Forgot (0) or Hard (0.5), ADD to Final Drill
      if (score <= QueueInteractionScore.HARD) {
        if (!finalDrillIds.includes(cardId)) {
          finalDrillIds = [...finalDrillIds, cardId];
        }
      } 
      // If score is Good (1) or Easy (1.5), REMOVE from Final Drill
      else if (score >= QueueInteractionScore.GOOD) {
        finalDrillIds = finalDrillIds.filter((id: string) => id !== cardId);
      }

      await plugin.storage.setSynced("finalDrillIds", finalDrillIds);
    }
  );
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);