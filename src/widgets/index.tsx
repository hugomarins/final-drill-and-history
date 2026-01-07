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

  // 1. New Final Drill Widget
  await plugin.app.registerWidget(
    "final_drill",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "auto", width: "100%" },
      widgetTabIcon: "https://cdn-icons-png.flaticon.com/512/3534/3534117.png",
      widgetTabTitle: "Final Drill",
    }
  );

  // 2. Existing Document History Widget
  await plugin.app.registerWidget(
    "rem_history",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "auto", width: "100%" },
      widgetTabIcon: "https://i.imgur.com/MLaBDJw.png", // Original Icon
    }
  );

  // 3. New Flashcard History Widget
  await plugin.app.registerWidget(
    "flashcard_history",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "auto", width: "100%" },
      widgetTabIcon: "https://cdn-icons-png.flaticon.com/512/9145/9145670.png",
      widgetTabTitle: "Flashcard History",
    }
  );


  // 4. New Practiced Queues Widget
  await plugin.app.registerWidget(
    "practiced_queues",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "auto", width: "100%" },
      widgetTabIcon: "https://cdn-icons-png.flaticon.com/512/6688/6688557.png",
      widgetTabTitle: "Practiced Queues",
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
    try {
      const now = Date.now();
      console.log("DEBUG: QueueLoadCard", data);

      // Check for IncRem (Type 15)
      const type = await plugin.queue.getCurrentQueueScreenType();
      console.log("DEBUG: Queue Type", type);

      // If generic/plugin type OR if type is undefined but we see IncRem signs (data.remId and no cardId)
      const isLikelyIncRem = type === QueueItemType.Plugin || (type === undefined && data?.remId && !data?.cardId);

      if (isLikelyIncRem) {
        // If an IncRem was already open? Add its time.
        if (currentIncRemStart) {
          if (currentSession) {
            currentSession.incRemsTime += (now - currentIncRemStart);
          }
        }

        if (currentSession) {
          currentSession.incRemsCount++;
        } else {
          console.warn("DEBUG: currentSession is null in QueueLoadCard (IncRem). Skipping count.");
        }

        currentIncRemStart = now;

        // --- Attempt to Capture Scope for Incremental Rem ---
        if (currentSession && (currentSession.scopeName === "Untitled" || currentSession.scopeName === "Ad-hoc Queue" || !currentSession.scopeName)) {
          console.log("DEBUG: Attempting to resolve IncRem scope name. Data:", data);
          if (data && data.remId) {
            const rem = await plugin.rem.findOne(data.remId);
            if (rem) {
              const text = rem.text ? await plugin.richText.toString(rem.text) : "";
              console.log("DEBUG: Resolved IncRem scope name:", text);
              if (text) currentSession.scopeName = text;
            }
          }
        }

      } else {
        // If we switched to a non-plugin card, close any open IncRem session
        if (currentIncRemStart) {
          if (currentSession) {
            currentSession.incRemsTime += (now - currentIncRemStart);
          }
          currentIncRemStart = null;
        }
      }

      // Track Flashcard Start Time
      if (data.cardId) {
        cardStartTimes.set(data.cardId, now);

        // --- Verify Final Drill Scope ---
        // If we labeled this as Final Drill, but the card is NOT in our Final Drill list,
        // it means it's an Embedded Queue collision (Ad-hoc).
        // --- Verify Final Drill Scope ---
        // If we labeled this as Final Drill, but the card is NOT in our Final Drill list,
        // it means it's an Embedded Queue collision (Ad-hoc).
        if (currentSession && currentSession.scopeName === "Final Drill") {
          const finalDrillItems = (await plugin.storage.getSynced("finalDrillIds")) as (string | { cardId: string })[] || [];

          let isOurCard = false;

          // Handle legacy strings and new objects
          if (finalDrillItems.length > 0) {
            isOurCard = finalDrillItems.some(item => {
              const id = typeof item === 'string' ? item : item.cardId;
              // console.log(`DEBUG: Checking ${id} vs ${data.cardId}`);
              return id === data.cardId;
            });
            console.log(`DEBUG: Verification result for ${data.cardId}: ${isOurCard}. List size: ${finalDrillItems.length}`);
          } else {
            console.log("DEBUG: Final Drill list is empty during verification.");
          }

          if (!isOurCard) {
            console.log("DEBUG: Card not in Final Drill list. Renaming to Ad-hoc Session.");
            currentSession.scopeName = "Ad-hoc Session";
          } else {
            console.log("DEBUG: Card verified as Final Drill item.");
          }
        }
      }
    } catch (error) {
      console.error("ERROR in QueueLoadCard listener:", error);
    }
  });

  plugin.event.addListener(AppEvents.QueueEnter, undefined, async (data: any) => {
    try {
      console.log("DEBUG: QueueEnter Data", data);
      const kbData = await plugin.kb.getCurrentKnowledgeBaseData();

      // --- Attempt to get Scope Name ---
      let scopeName = "Ad-hoc Queue";
      let queueId = data?.subQueueId;
      console.log("DEBUG: subQueueId", queueId);

      // Validate queueId: check if it's a valid ID string (not a random specific number '0.xxxx')
      const isValidId = queueId && typeof queueId === 'string' && !queueId.startsWith("0.");

      // --- DEBOUNCE / PRIORITY LOGIC ---
      // If this is a generic ID ('0.xxx'), check if we ALREADY have a valid session established very recently.
      if (!isValidId && queueId && queueId.startsWith("0.")) {
        if (currentSession && currentSession.queueId && !currentSession.queueId.startsWith("0.")) {
          const timeSinceStart = Date.now() - currentSession.startTime;
          // If the valid session started less than 1000ms ago, assume this generic event is just noise (like Final Drill sidebar init)
          if (timeSinceStart < 1000) {
            console.log(`DEBUG: Ignoring generic queue ID ${queueId} because a valid session (${currentSession.scopeName}) started ${timeSinceStart}ms ago.`);
            await plugin.storage.setSession("finalDrillBlocked", true);
            return;
          }
        }
      }

      if (isValidId) {
        await plugin.storage.setSession("finalDrillBlocked", false);
        const rem = await plugin.rem.findOne(queueId);
        if (rem) {
          // Prefer text property, fallback to generic
          const text = rem.text ? await plugin.richText.toString(rem.text) : "";
          if (text && text.trim().length > 0) {
            scopeName = text;
          } else {
            scopeName = "Untitled";
          }
        }
      } else if (queueId && queueId.startsWith("0.")) {
        // It is a generated ID. It could be "Practice All", "Final Drill", or "Embedded Queue".

        // Check if Final Drill reports being active
        // We wait a tiny bit for the Final Drill widget to potentially update status if it was just mounted?
        // Actually, rely on the stored flag.
        const isFinalDrillActive = await plugin.storage.getSession("finalDrillActive");

        // Also check screen type to be sure
        await new Promise(resolve => setTimeout(resolve, 200));
        const type = await plugin.queue.getCurrentQueueScreenType();

        console.log("DEBUG: Generic ID. Type:", type, "FinalDrillActive:", isFinalDrillActive);

        if (type && type > 0) {
          scopeName = "Ad-hoc Session";
        } else {
          if (isFinalDrillActive) {
            scopeName = "Final Drill";
          } else {
            scopeName = "Ad-hoc Session";
          }
        }
      }

      console.log("DEBUG: Final Scope Name:", scopeName);

      currentSession = {
        id: Math.random().toString(36).substring(7),
        startTime: Date.now(),
        kbId: kbData._id,
        queueId: isValidId ? queueId : undefined, // Don't store garbage IDs
        scopeName: scopeName,
        totalTime: 0,
        flashcardsCount: 0,
        flashcardsTime: 0,
        incRemsCount: 0,
        incRemsTime: 0,
      };
      cardStartTimes.clear();
      currentIncRemStart = null;
    } catch (error) {
      console.error("ERROR in QueueEnter listener:", error);
    }
  });

  plugin.event.addListener(AppEvents.QueueExit, undefined, async () => {
    // Unblock Final Drill when leaving any queue
    await plugin.storage.setSession("finalDrillBlocked", false);

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
        // Fetch text for search
        // Fetch text for search
        const rem = await plugin.rem.findOne(currentRemId);
        const frontText = rem?.text ? await plugin.richText.toString(rem.text) : "";
        const backText = rem?.backText ? await plugin.richText.toString(rem.backText) : "";
        const text = `${frontText} ${backText}`.trim();

        await plugin.storage.setSynced("remData", [
          {
            key: Math.random(),
            remId: currentRemId,
            open: false,
            time: new Date().getTime(),
            kbId: currentKbId, // Save KB ID
            text: text, // Save Text for Search
            _v: 1,
          },
          ...currentRemData.slice(0, 199),
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

      // REMOVED Fallback Update Scope Name as per user request (Ancestor Traversal)

      // Get current KB ID
      const kbData = await plugin.kb.getCurrentKnowledgeBaseData();
      const currentKbId = kbData._id;

      // --- Logic for Enhancement 1: Flashcard History ---
      const historyData = (await plugin.storage.getSynced("flashcardHistoryData")) as FlashcardHistoryData[] || [];

      if (historyData[0]?.cardId !== cardId) {
        // Fetch text for search. Note: We use the REM's text, not the card's specific question/answer,
        // as the scope is usually the Rem itself.
        const rem = await plugin.rem.findOne(remId);
        const frontText = rem?.text ? await plugin.richText.toString(rem.text) : "";
        const backText = rem?.backText ? await plugin.richText.toString(rem.backText) : "";
        const text = `${frontText} ${backText}`.trim();

        await plugin.storage.setSynced("flashcardHistoryData", [
          {
            key: Math.random(),
            remId: remId,
            open: false,
            cardId: cardId,
            time: new Date().getTime(),
            kbId: currentKbId, // Save KB ID
            text: text, // Save Text for Search
            _v: 1,
          },
          ...historyData.slice(0, 199),
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