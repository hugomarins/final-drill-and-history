import {
  RemId,
  WidgetLocation,
  declareIndexPlugin,
  ReactRNPlugin,
  AppEvents,
  QueueInteractionScore,
  QueueItemType,
} from "@remnote/plugin-sdk";
import { FlashcardHistoryData } from "./flashcard_history"
import { RemHistoryData } from "./rem_history"
import { PracticedQueueSession } from "./practiced_queues"
import "../style.css";

// Union type for Final Drill to support legacy (string) and new (object) formats
type FinalDrillItem = string | { cardId: string; kbId?: string; addedAt?: number };

async function onActivate(plugin: ReactRNPlugin) {
  // Register Setting for Old Items Threshold
  await plugin.settings.registerNumberSetting({
    id: "old_item_threshold",
    title: "Final Drill: Old Items Threshold (Days)",
    description: "Items older than this number of days will trigger a warning.",
    defaultValue: 7,
  });

  // 1. Existing Document History Widget
  await plugin.app.registerWidget(
    "rem_history",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "auto", width: "100%" },
      widgetTabIcon: "https://i.imgur.com/MLaBDJw.png", // Original Icon
    }
  );

  // 2. New Flashcard History Widget
  await plugin.app.registerWidget(
    "flashcard_history",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "auto", width: "100%" },
      widgetTabIcon: "https://cdn-icons-png.flaticon.com/512/9145/9145670.png",
      widgetTabTitle: "Flashcard History",
    }
  );


  // 3. New Practiced Queues Widget
  await plugin.app.registerWidget(
    "practiced_queues",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "auto", width: "100%" },
      widgetTabIcon: "https://cdn-icons-png.flaticon.com/512/6688/6688557.png",
      widgetTabTitle: "Practiced Queues",
    }
  );

  // 4. New Final Drill Widget
  await plugin.app.registerWidget(
    "final_drill",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "auto", width: "100%" },
      widgetTabIcon: "https://cdn-icons-png.flaticon.com/512/3534/3534117.png",
      widgetTabTitle: "Final Drill",
    }
  );


  // --- Event Listeners ---

  // Track current session
  let currentSession: PracticedQueueSession | null = null;
  // Track current card start time
  // Use a Map to handle interleaved load/complete events (fix 0s time issue)
  let cardStartTimes = new Map<string, number>();
  // Track IncRem start specifically since it might not trigger Complete
  let currentIncRemStart: number | null = null;

  plugin.event.addListener(AppEvents.QueueLoadCard, undefined, async (data: any) => {
    const now = Date.now();

    // Check for IncRem (Type 15)
    const type = await plugin.queue.getCurrentQueueScreenType();

    if (type === QueueItemType.Plugin) {
      // If an IncRem was already open? Add its time.
      if (currentIncRemStart) {
        currentSession!.incRemsTime += (now - currentIncRemStart);
      }
      currentSession!.incRemsCount++;
      currentIncRemStart = now;
    } else {
      // If we switched to a non-plugin card, close any open IncRem session
      if (currentIncRemStart) {
        currentSession!.incRemsTime += (now - currentIncRemStart);
        currentIncRemStart = null;
      }
    }

    // Track Flashcard Start Time
    if (data.cardId) {
      cardStartTimes.set(data.cardId, now);
    }
  });

  plugin.event.addListener(AppEvents.QueueEnter, undefined, async (data: any) => {
    const kbData = await plugin.kb.getCurrentKnowledgeBaseData();
    currentSession = {
      id: Math.random().toString(36).substring(7),
      startTime: Date.now(),
      kbId: kbData._id,
      queueId: data?.subQueueId,
      totalTime: 0,
      flashcardsCount: 0,
      flashcardsTime: 0,
      incRemsCount: 0,
      incRemsTime: 0,
    };
    cardStartTimes.clear();
    currentIncRemStart = null;
  });

  plugin.event.addListener(AppEvents.QueueExit, undefined, async () => {
    if (currentSession) {
      currentSession.endTime = Date.now();

      // Only save if practiced at least one card or just save everything? 
      // User said "record the documents that I have practiced the queue of flashcards".
      // Usually implies actually practicing.
      if (currentSession.flashcardsCount > 0 || currentSession.incRemsCount > 0) {
        // Finalize IncRem time if active
        if (currentIncRemStart) {
          currentSession.incRemsTime += (Date.now() - currentIncRemStart);
        }
        // Recalculate Total Time to be sum of parts logic
        currentSession.totalTime = currentSession.flashcardsTime + currentSession.incRemsTime;

        const history = (await plugin.storage.getSynced("practicedQueuesHistory")) as PracticedQueueSession[] || [];
        await plugin.storage.setSynced("practicedQueuesHistory", [currentSession, ...history.slice(0, 99)]);
      }

      currentSession = null;
      cardStartTimes.clear();
      currentIncRemStart = null;
    }
  });

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

  // Flashcard Queue Listener for Completion
  plugin.event.addListener(
    AppEvents.QueueCompleteCard,
    undefined,
    async (message) => {
      const { cardId, score } = message as { cardId: string; score: QueueInteractionScore };

      if (currentSession && cardId) {
        // It's a Flashcard Completion (IncRems typically don't fire this or lack ID)
        const startTime = cardStartTimes.get(cardId);
        if (startTime) {
          const timeSpent = Date.now() - startTime;
          currentSession.totalTime += timeSpent;
          currentSession.flashcardsTime += timeSpent;
          currentSession.flashcardsCount++;
          cardStartTimes.delete(cardId);
        }
      } else {
        // Close any lingering IncRem
        if (currentIncRemStart && currentSession) {
          currentSession.incRemsTime += (Date.now() - currentIncRemStart);
          currentIncRemStart = null;
        }
      }
      // currentCardStartTime = null; // Reset for next card // This line is removed as per instruction

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
          // Store as object with KB ID and addedAt timestamp
          finalDrillIds = [...finalDrillIds, {
            cardId,
            kbId: currentKbId,
            addedAt: Date.now()
          }];
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

async function onDeactivate(_: ReactRNPlugin) { }

declareIndexPlugin(onActivate, onDeactivate);