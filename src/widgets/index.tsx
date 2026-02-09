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
    title: "Old Items Threshold (Days) for Final Drill",
    description: "Items older than this number of days will trigger a warning.",
    defaultValue: 7,
  });

  // 1. New Final Drill Widget
  await plugin.app.registerWidget(
    "final_drill",
    WidgetLocation.Popup,
    {
      dimensions: { height: "100vh" as any, width: "min(85vw, 1100px)" as any },

    }
  );

  // Command to open Final Drill
  await plugin.app.registerCommand({
    id: "open_final_drill",
    name: "Final Drill: deliberately practice poorly rated cards",
    action: async () => {
      await plugin.widget.openPopup("final_drill");
    },
  });

  // Debug Command: Clear Flashcard History
  await plugin.app.registerCommand({
    id: "debug_clear_flashcard_history",
    name: "Debug: Clear Flashcard History (Fix Sync Error)",
    action: async () => {
      await plugin.storage.setSynced("flashcardHistoryData", []);
      await plugin.app.toast("Flashcard History cleared!");
    },
  });

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

  // 5. Final Drill Notification Widget
  await plugin.app.registerWidget(
    "final_drill_notification",
    // @ts-ignore - Assuming SidebarEnd exists or use valid fallback
    WidgetLocation.SidebarEnd,
    {
      dimensions: { height: "auto", width: "100%" },
    }
  );

  // Settings
  await plugin.settings.registerBooleanSetting({
    id: "disable_final_drill_notification",
    title: "Disable Final Drill Notifications",
    defaultValue: false,
  });


  // --- Event Listeners ---

  // Track current session
  let currentSession: PracticedQueueSession | null = null;
  // Track current card start time
  // Use a Map to handle interleaved load/complete events (fix 0s time issue)
  let cardStartTimes = new Map<string, number>();
  // Track IncRem start specifically since it might not trigger Complete
  let currentIncRemStart: number | null = null;
  // Track last Main Queue Entry time to debounce Sidebar Queue Entry
  let lastQueueEnterIsMain = 0;

  // --- Helper: Save and Close Current Session ---
  const saveCurrentSession = async (reason: string) => {
    if (!currentSession) return;


    currentSession.endTime = Date.now();

    // Finalize IncRem time if active
    if (currentIncRemStart) {
      currentSession.incRemsTime += (Date.now() - currentIncRemStart);
    }
    // Recalculate Total Time
    currentSession.totalTime = currentSession.flashcardsTime + currentSession.incRemsTime;

    // Only save if data exists (user actually practiced)
    if (currentSession.flashcardsCount > 0 || currentSession.incRemsCount > 0) {
      const history = (await plugin.storage.getSynced("practicedQueuesHistory")) as PracticedQueueSession[] || [];
      await plugin.storage.setSynced("practicedQueuesHistory", [currentSession, ...history]);
    } else {
    }

    currentSession = null;
    cardStartTimes.clear();
    currentIncRemStart = null;
    // Clear Live Session
    await plugin.storage.setSession("activeQueueSession", null);
    // Clear heartbeat
    await plugin.storage.setSession("finalDrillHeartbeat", 0);
  };

  // --- Heartbeat Monitor (Single Instance) ---
  setInterval(async () => {
    if (currentSession && currentSession.scopeName === "Final Drill") {
      // Grace Period: Don't kill session if it just started (e.g. < 5s)
      if (Date.now() - currentSession.startTime < 5000) {
        return;
      }

      const lastHeartbeat = await plugin.storage.getSession<number>("finalDrillHeartbeat");
      if (lastHeartbeat) {
        const timeSinceHeartbeat = Date.now() - lastHeartbeat;
        if (timeSinceHeartbeat > 5000) {
          await saveCurrentSession("Heartbeat Stale");
        }
      }
    }
  }, 2500);

  plugin.event.addListener(AppEvents.QueueLoadCard, undefined, async (data: any) => {
    try {
      const now = Date.now();

      // Retry getting the queue type. When switching sidebar tabs, it can momentarily be undefined.
      const type = await plugin.queue.getCurrentQueueScreenType();

      // --- Lazy Session Initialization (Mobile Fix) ---
      // If QueueEnter failed to fire (common on iOS), start session here.
      if (!currentSession) {
        try {
          const kbData = await plugin.kb.getCurrentKnowledgeBaseData();
          let scopeName = "Restored Mobile Session";
          // Attempt to get context if possible, but data here is Card-specific, not Queue-specific usually.
          // We'll rely on generic naming or later scope resolution if possible.

          // Check if Final Drill (implied by type or state)
          const isFinalDrillActive = await plugin.storage.getSession<boolean>("finalDrillActive");
          if (isFinalDrillActive) {
            scopeName = "Final Drill";
          }

          currentSession = {
            id: Math.random().toString(36).substring(7),
            startTime: Date.now(),
            kbId: kbData._id,
            // We lack queueId here unless we can retrieve it elsewhere, so undefined.
            scopeName: scopeName,
            totalTime: 0,
            flashcardsCount: 0,
            flashcardsTime: 0,
            incRemsCount: 0,
            incRemsTime: 0,
            againCount: 0,
            currentCardFirstRep: undefined,
          };
          // Sync Live
          await plugin.storage.setSession("activeQueueSession", currentSession);
          cardStartTimes.clear();
          currentIncRemStart = null;
        } catch (err) {
          console.error("ERROR: Failed to lazily initialize session", err);
        }
      }
      // --- End Lazy Init ---

      // If generic/plugin type OR if type is undefined but we see IncRem signs (data.remId and no cardId)
      // Robust Check: If type is undefined, trust the data signature.
      // IncRems ALWAYs have but NO cardId. Sometimes remId is also missing in the event data,
      // so we assume anything without a cardId is an IncRem when Type is undefined.
      const isLikelyIncRem = type === QueueItemType.Plugin || ((type === undefined || type === null) && !data?.cardId);


      if (isLikelyIncRem) {
        // If an IncRem was already open? Add its time.
        if (currentIncRemStart) {
          if (currentSession) {
            const duration = now - currentIncRemStart;
            currentSession.incRemsTime += duration;
            currentSession.totalTime += duration;
          }
        }

        if (currentSession) {
          currentSession.incRemsCount++;
        } else {
          console.warn("DEBUG: currentSession is null in QueueLoadCard (IncRem). Skipping count.");
        }

        currentIncRemStart = now;

        // Sync Live Updates (IncRem started/counted)
        if (currentSession) {
          await plugin.storage.setSession("activeQueueSession", currentSession);
        }

        // --- Attempt to Capture Scope for Incremental Rem ---
        if (currentSession && (currentSession.scopeName === "Untitled" || currentSession.scopeName === "Ad-hoc Queue" || !currentSession.scopeName)) {
          if (data && data.remId) {
            const rem = await plugin.rem.findOne(data.remId);
            if (rem) {
              const text = rem.text ? await plugin.richText.toString(rem.text) : "";
              if (text) currentSession.scopeName = text;
            }
          }
        }

      } else {
        // If we switched to a non-plugin card, close any open IncRem session
        if (currentIncRemStart) {
          if (currentSession) {
            const duration = now - currentIncRemStart;
            currentSession.incRemsTime += duration;
            currentSession.totalTime += duration;
          }
          currentIncRemStart = null;
        }
      }

      // Track Flashcard Start Time
      if (data.cardId) {
        // Track Previous and Current Card for Edit Features
        const lastCurrentId = await plugin.storage.getSession<string>("finalDrillCurrentCardId");
        if (lastCurrentId && lastCurrentId !== data.cardId) {
          await plugin.storage.setSession("finalDrillPreviousCardId", lastCurrentId);
        }
        await plugin.storage.setSession("finalDrillCurrentCardId", data.cardId);

        // --- Card Age Logic ---
        // Fetch card to determine age (first repetition)
        if (currentSession) {
          // Shift Current Stats to Previous Stats (if meaningful)
          // Shift Current Stats to Previous Stats (always, even if it was a New card)
          currentSession.prevCardFirstRep = currentSession.currentCardFirstRep;
          currentSession.prevCardTotalTime = currentSession.currentCardTotalTime;
          currentSession.prevCardRepCount = currentSession.currentCardRepCount;
          currentSession.prevCardId = currentSession.currentCardId;
          // Note: prevCardInterval and prevCardNextRepTime will be updated after rating in QueueCompleteCard
          currentSession.currentCardId = data.cardId;

          const card = await plugin.card.findOne(data.cardId);
          if (card?.repetitionHistory?.length > 0) {
            const dates = card.repetitionHistory.map(h => h.date);
            if (dates.length > 0) {
              currentSession.currentCardFirstRep = Math.min(...dates);
            }

            // Calculate current interval (before this rep)
            // Note: card.lastRepetitionTime may be undefined, so we derive it from history
            const lastRepTime = card.lastRepetitionTime || (dates.length > 0 ? Math.max(...dates) : undefined);
            if (card.nextRepetitionTime && lastRepTime) {
              currentSession.currentCardInterval = card.nextRepetitionTime - lastRepTime;
            } else {
              currentSession.currentCardInterval = undefined;
            }

            // Calculate Total Time and Rep Count (ignoring skipped)
            let totalCardTime = 0;
            let totalCardReps = 0;
            card.repetitionHistory.forEach(rep => {
              if (rep.score !== QueueInteractionScore.TOO_EARLY) {
                totalCardReps++;
                if (rep.responseTime) {
                  totalCardTime += rep.responseTime;
                }
              }
            });
            currentSession.currentCardTotalTime = totalCardTime;
            currentSession.currentCardRepCount = totalCardReps;
          } else {
            currentSession.currentCardFirstRep = undefined; // New card
            currentSession.currentCardTotalTime = 0;
            currentSession.currentCardRepCount = 0;
            currentSession.currentCardInterval = undefined;
          }
          // Sync Live Updates
          await plugin.storage.setSession("activeQueueSession", currentSession);
        }

        cardStartTimes.set(data.cardId, now);

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
              return id === data.cardId;
            });
          } else {
          }

          if (!isOurCard) {
            currentSession.scopeName = "Ad-hoc Session";
          } else {
          }
        }
      }
    } catch (error) {
      console.error("ERROR in QueueLoadCard listener:", error);
    }
  });

  plugin.event.addListener(AppEvents.QueueEnter, undefined, async (data: any) => {
    try {

      // Safety Net: If a session is already active (missed exit?), save it first.
      if (currentSession) {
        await saveCurrentSession("QueueEnter Overwrite");
      }

      const kbData = await plugin.kb.getCurrentKnowledgeBaseData();

      // --- Attempt to get Scope Name ---
      let scopeName = "Ad-hoc Queue";
      let queueId = data?.subQueueId;

      // Validate queueId: check if it's a valid ID string (not a random specific number '0.xxxx')
      const isValidId = queueId && typeof queueId === 'string' && !queueId.startsWith("0.");

      if (isValidId) {
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
      } else {
        // It is a generated ID. It could be "Practice All", "Final Drill", or "Embedded Queue".

        // Check if Final Drill reports being active (Robust check)
        const isFinalDrillActive = await plugin.storage.getSession<boolean>("finalDrillActive");
        // Also check Heartbeat for safety (if Active is stale)
        const lastHeartbeat = await plugin.storage.getSession<number>("finalDrillHeartbeat");
        const isFresh = lastHeartbeat && (Date.now() - lastHeartbeat < 4000);

        if (isFinalDrillActive || isFresh) {
          scopeName = "Final Drill";
        } else {
          scopeName = "Ad-hoc Session";
        }
      }


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
        againCount: 0,
        currentCardFirstRep: undefined,
      };
      // Sync to Storage for Live View
      await plugin.storage.setSession("activeQueueSession", currentSession);

      cardStartTimes.clear();
      currentIncRemStart = null;
    } catch (error) {
      console.error("ERROR in QueueEnter listener:", error);
    }
  });

  plugin.event.addListener(AppEvents.QueueExit, undefined, async () => {
    // Unblock Final Drill when leaving any queue (Implicitly handled by freeing session)

    if (currentSession) {
      await saveCurrentSession("QueueExit Event");
    }
  });

  // Listener to manually force save session (e.g. when Final Drill popup closes without QueueExit)
  plugin.event.addListener("force_save_session", undefined, async () => {
    if (currentSession) {
      await saveCurrentSession("force_save_session Event");
    } else {
    }
  });

  // Document History Listener
  plugin.event.addListener(
    AppEvents.GlobalOpenRem,
    undefined,
    async (message) => {
      // Fallback: If we are navigating away (GlobalOpenRem) and have an active session, save it.
      if (currentSession) {
        await saveCurrentSession("GlobalOpenRem Navigation");
      }
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
          ...currentRemData.slice(0, 500),
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
          if (score === 0) {
            currentSession.againCount = (currentSession.againCount || 0) + 1;
          }

          // START Fix for Live Dashboard
          // We must update the card-specific stats here because this is when the rep is actually finalized.
          // We check if this card is the current one or the previous one in the session state.
          if (score !== QueueInteractionScore.TOO_EARLY) {
            if (currentSession.currentCardId === cardId) {
              currentSession.currentCardTotalTime = (currentSession.currentCardTotalTime || 0) + timeSpent;
              currentSession.currentCardRepCount = (currentSession.currentCardRepCount || 0) + 1;
            }
            if (currentSession.prevCardId === cardId) {
              currentSession.prevCardTotalTime = (currentSession.prevCardTotalTime || 0) + timeSpent;
              currentSession.prevCardRepCount = (currentSession.prevCardRepCount || 0) + 1;
            }
          }
          // END Fix

          cardStartTimes.delete(cardId);
        } else {
          console.warn(`DEBUG: No start time found for completed card ${cardId}`);
        }
      } else {
        // Close any lingering IncRem
        if (currentIncRemStart && currentSession) {
          const duration = Date.now() - currentIncRemStart;
          currentSession.incRemsTime += duration;
          currentSession.totalTime += duration;
          currentIncRemStart = null;
        }
      }


      // Sync Live Updates
      if (currentSession) {
        await plugin.storage.setSession("activeQueueSession", currentSession);
      }
      // currentCardStartTime = null; // Reset for next card // This line is removed as per instruction

      if (!cardId) return;

      const card = await plugin.card.findOne(cardId);
      if (!card) return;

      const remId = card.remId;

      // --- Update Previous Card Interval/Coverage after rating ---
      // When a card is rated, we can now get its new interval (after the scheduler updates)
      // If this card was the "current" card at the time of rating, it will become "prev" when next card loads.
      // However, we update prevCard data here if this cardId matches prevCardId (i.e., we're completing a card that was already moved to prev)
      // OR if it matches currentCardId (the card we just rated, which will become prev when Next card loads).
      if (currentSession && score !== QueueInteractionScore.TOO_EARLY) {
        // The card we just completed will be shown as "prev" after the next card loads.
        // So we update the "prev" interval/nextRepTime now with the NEWLY scheduled values.
        if (currentSession.currentCardId === cardId || currentSession.prevCardId === cardId) {
          // Derive lastRepTime from history if SDK doesn't provide it
          const dates = card.repetitionHistory?.map(h => h.date) || [];
          const lastRepTime = card.lastRepetitionTime || (dates.length > 0 ? Math.max(...dates) : undefined);

          if (card.nextRepetitionTime && lastRepTime) {
            // New interval after this rep
            const newInterval = card.nextRepetitionTime - lastRepTime;
            // If this is the current card, it will become prev on next load, so update prev fields
            if (currentSession.currentCardId === cardId) {
              currentSession.prevCardInterval = newInterval;
              currentSession.prevCardNextRepTime = card.nextRepetitionTime;
            } else if (currentSession.prevCardId === cardId) {
              currentSession.prevCardInterval = newInterval;
              currentSession.prevCardNextRepTime = card.nextRepetitionTime;
            }
            // Sync updated session
            await plugin.storage.setSession("activeQueueSession", currentSession);
          }
        }
      }

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
        const frontText = rem?.text ? (await plugin.richText.toString(rem.text)).substring(0, 1000) : "";
        const backText = rem?.backText ? (await plugin.richText.toString(rem.backText)).substring(0, 1000) : "";
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
          ...historyData.slice(0, 999),
        ]);
      }
      // --- Logic for Enhancement 2: Final Drill ---

      // Heartbeat Monitor logic moved to onActivate to avoid multiple intervals


      // Type is now mixed (string | object) to support legacy data
      let finalDrillIds = (await plugin.storage.getSynced("finalDrillIds")) as FinalDrillItem[] || [];

      // Helper to extract ID regardless of format
      const getCardId = (item: FinalDrillItem) => typeof item === 'string' ? item : item.cardId;

      // Only add cards that were explicitly rated AGAIN or HARD (not TOO_EARLY, RESET, etc.)
      if (score === QueueInteractionScore.AGAIN || score === QueueInteractionScore.HARD) {
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