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
  // 1. Document History Widget
  await plugin.app.registerWidget(
    "rem_history",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "100%", width: "100%" },
      widgetTabIcon: "https://i.imgur.com/MLaBDJw.png", // Original Icon
    }
  );

  // 2. Flashcard History Widget
  await plugin.app.registerWidget(
    "flashcard_history",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "100%", width: "100%" },
      widgetTabIcon: "https://cdn-icons-png.flaticon.com/512/9145/9145670.png",
      widgetTabTitle: "Flashcard History",
    }
  );

  // 3. Existing Final Drill Widget (Right Sidebar)
  await plugin.app.registerWidget(
    "final_drill",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "100%", width: "100%" },
      widgetTabIcon: "https://cdn-icons-png.flaticon.com/512/3534/3534117.png",
      widgetTabTitle: "Final Drill",
    }
  );

  // 4. NEW: Final Drill Pane Widget (Full Screen)
  // This widget uses the logic from 'src/widgets/final_drill_pane.tsx'
  await plugin.app.registerWidget(
    "final_drill_pane",
    WidgetLocation.Pane,
    {
      dimensions: { height: "100%", width: "100%" },
      widgetTabTitle: "Final Drill Practice",
    }
  );

  // 5. NEW: Command to open the Final Drill
  await plugin.app.registerCommand({
    id: "start-final-drill",
    name: "Final Drill: Practice poorly rated Cards (Forgot and Hard)",
    description: "Open the Final Drill queue in the main window.",
    action: async () => {
      const finalDrillIds = (await plugin.storage.getSynced("finalDrillIds")) || [];
      
      if (finalDrillIds.length === 0) {
        await plugin.app.toast("Final Drill is empty! Good job.");
      } else {
        // Open the pane widget we just registered
        await plugin.window.openWidgetInPane("final_drill_pane");
      }
    },
  });

  // --- Event Listeners ---

  // Document History Listener
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

      // History Logic
      const historyData = (await plugin.storage.getSynced("flashcardHistoryData")) || [];
      if (historyData[0]?.cardId !== cardId) {
         await plugin.storage.setSynced("flashcardHistoryData", [
          {
            key: Math.random(),
            remId: remId,
            cardId: cardId,
            time: new Date().getTime(),
          },
          ...historyData.slice(0, 99),
        ]);
      }

      // Final Drill Logic
      let finalDrillIds = (await plugin.storage.getSynced("finalDrillIds")) || [];
      
      // AGAIN (0) or HARD (0.5) -> ADD to drill
      if (score <= QueueInteractionScore.HARD) {
        if (!finalDrillIds.includes(cardId)) {
          finalDrillIds = [...finalDrillIds, cardId];
        }
      } 
      // GOOD (1) or EASY (1.5) -> REMOVE from drill
      else if (score >= QueueInteractionScore.GOOD) {
        finalDrillIds = finalDrillIds.filter((id: string) => id !== cardId);
      }

      await plugin.storage.setSynced("finalDrillIds", finalDrillIds);
    }
  );
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);