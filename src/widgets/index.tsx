import {
  RemId,
  WidgetLocation,
  declareIndexPlugin,
  ReactRNPlugin,
  AppEvents,
  QueueInteractionScore,
} from "@remnote/plugin-sdk";
import { FlashcardHistoryData } from "./flashcard_history"
import { RemHistoryData } from "./rem_history"
import "../style.css";

// Union type for Final Drill to support legacy (string) and new (object) formats
type FinalDrillItem = string | { cardId: string; kbId?: string };

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

  // 2. New Flashcard History Widget
  await plugin.app.registerWidget(
    "flashcard_history",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "100%", width: "100%" },
      widgetTabIcon: "https://cdn-icons-png.flaticon.com/512/9145/9145670.png",
      widgetTabTitle: "Flashcard History",
    }
  );

  // 3. New Final Drill Widget
  await plugin.app.registerWidget(
    "final_drill",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "100%", width: "100%" },
      widgetTabIcon: "https://cdn-icons-png.flaticon.com/512/3534/3534117.png",
      widgetTabTitle: "Final Drill",
    }
  );

  // --- Event Listeners ---

  // Document History Listener
  plugin.event.addListener(
    AppEvents.GlobalOpenRem,
    undefined,
    async (message) => {
      const currentRemId = message.remId as RemId;
      const currentRemData = (await plugin.storage.getSynced("remData")) as RemHistoryData[] || [];

      // Get current KB ID
      const kbData = await plugin.kb.getCurrentKnowledgeBaseData();
      const currentKbId = kbData._id;

      if (currentRemData[0]?.remId != currentRemId) {
        await plugin.storage.setSynced("remData", [
          {
            key: Math.random(),
            remId: currentRemId,
            open: false,
            time: new Date().getTime(),
            kbId: currentKbId, // Save KB ID
          },
          ...currentRemData,
        ]);
      }
    }
  );

  // Flashcard Queue Listener
  plugin.event.addListener(
    AppEvents.QueueCompleteCard,
    undefined,
    async (message) => {
      const { cardId, score } = message as { cardId: string; score: QueueInteractionScore };
      
      if (!cardId) return;

      const card = await plugin.card.findOne(cardId);
      if (!card) return;

      const remId = card.remId;

      // Get current KB ID
      const kbData = await plugin.kb.getCurrentKnowledgeBaseData();
      const currentKbId = kbData._id;

      // --- Logic for Enhancement 1: Flashcard History ---
      const historyData = (await plugin.storage.getSynced("flashcardHistoryData")) as FlashcardHistoryData[] || [];
      
      if (historyData[0]?.cardId !== cardId) {
         await plugin.storage.setSynced("flashcardHistoryData", [
          {
            key: Math.random(),
            remId: remId,
            open: false,
            cardId: cardId,
            time: new Date().getTime(),
            kbId: currentKbId, // Save KB ID
          },
          ...historyData.slice(0, 99),
        ]);
      }

      // --- Logic for Enhancement 2: Final Drill ---
      // Type is now mixed (string | object) to support legacy data
      let finalDrillIds = (await plugin.storage.getSynced("finalDrillIds")) as FinalDrillItem[] || [];
      
      // Helper to extract ID regardless of format
      const getCardId = (item: FinalDrillItem) => typeof item === 'string' ? item : item.cardId;

      if (score <= QueueInteractionScore.HARD) {
        // Add if not present
        if (!finalDrillIds.some(item => getCardId(item) === cardId)) {
          // Store as object with KB ID
          finalDrillIds = [...finalDrillIds, { cardId, kbId: currentKbId }];
        }
      } 
      else if (score >= QueueInteractionScore.GOOD) {
        // Remove
        finalDrillIds = finalDrillIds.filter((item) => getCardId(item) !== cardId);
      }

      await plugin.storage.setSynced("finalDrillIds", finalDrillIds);
    }
  );
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);