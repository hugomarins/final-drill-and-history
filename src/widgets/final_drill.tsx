
import React, { useEffect, useState, useRef } from "react";
import {
  renderWidget,
  useSyncedStorageState,
  Queue,
  usePlugin,
  useTrackerPlugin,
  AppEvents,
  RemHierarchyEditorTree, // Import Editor
  RemRichTextEditor,
  BuiltInPowerupCodes,
} from "@remnote/plugin-sdk";

// Define the mixed type here as well
type FinalDrillItem = string | { cardId: string; kbId?: string; addedAt?: number };

function FinalDrill() {
  const plugin = usePlugin();
  // Access the synced list (now using the mixed type)
  const [finalDrillIdsRaw, setFinalDrillIdsRaw] = useSyncedStorageState<FinalDrillItem[]>("finalDrillIds", []);

  // State for IDs filtered by current KB
  const [filteredIds, setFilteredIds] = useState<string[]>([]);
  // State for old items count
  const [oldItemsCount, setOldItemsCount] = useState<number>(0);

  // Queue Key to force re-render ONLY on 0 -> N transitions (fixes empty state bug without fragmenting sessions)
  const [queueKey, setQueueKey] = useState<number>(0);
  const prevFilteredIdsLength = useRef<number>(0);

  useEffect(() => {
    // Only increment key if we transitioned from 0 items to some items.
    // This allows the Queue to initialize correctly when data arrives.
    // But keeps the key STABLE when items are removed during practice (N -> N-1), preserving the session.
    if (filteredIds.length > 0 && prevFilteredIdsLength.current === 0) {
      setQueueKey(prev => prev + 1);
    }
    prevFilteredIdsLength.current = filteredIds.length;
  }, [filteredIds.length]);

  // Settings
  const oldItemThreshold = useTrackerPlugin(async (reactivePlugin) => {
    return await reactivePlugin.settings.getSetting<number>("old_item_threshold");
  }, [plugin]) ?? 7;

  // Dialog states
  const [showClearOldConfirm, setShowClearOldConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  useEffect(() => {
    async function updateDerivedState() {
      // Fetch KB Metadata
      const currentKb = await plugin.kb.getCurrentKnowledgeBaseData();
      const isPrimary = await plugin.kb.isPrimaryKnowledgeBase();
      const currentKbId = currentKb._id;

      let relevantIds: string[] = [];
      let oldCount = 0;
      const now = Date.now();
      const msPerDay = 1000 * 60 * 60 * 24;

      finalDrillIdsRaw.forEach(item => {
        let isRelevant = false;
        let addedAt: number | undefined;

        if (typeof item === 'string') {
          // Legacy Item: Include only if we are in the Primary KB
          if (isPrimary) isRelevant = true;
        } else {
          // New Item: Include only if KB ID matches
          if (item.kbId === currentKbId) {
            isRelevant = true;
            addedAt = item.addedAt;
          }
        }

        if (isRelevant) {
          const id = typeof item === 'string' ? item : item.cardId;
          relevantIds.push(id);

          // Check if old
          if (addedAt) {
            const daysOld = (now - addedAt) / msPerDay;
            if (daysOld > oldItemThreshold) {
              oldCount++;
            }
          }
        }
      });

      setFilteredIds(relevantIds);
      setOldItemsCount(oldCount);
    }

    if (plugin) {
      updateDerivedState();
    }
  }, [finalDrillIdsRaw, plugin, oldItemThreshold]);

  const clearOldItems = async () => {
    const currentKb = await plugin.kb.getCurrentKnowledgeBaseData();
    const currentKbId = currentKb._id;
    const now = Date.now();
    const msPerDay = 1000 * 60 * 60 * 24;

    const newIds = finalDrillIdsRaw.filter(item => {
      // Keep if it's NOT an old item for this KB
      if (typeof item !== 'string' && item.kbId === currentKbId && item.addedAt) {
        const daysOld = (now - item.addedAt) / msPerDay;
        if (daysOld > oldItemThreshold) {
          return false; // Remove
        }
      }
      return true; // Keep others
    });

    await setFinalDrillIdsRaw(newIds);
    setShowClearOldConfirm(false);
  };

  const clearAllItems = async () => {
    const currentKb = await plugin.kb.getCurrentKnowledgeBaseData();
    const isPrimary = await plugin.kb.isPrimaryKnowledgeBase();
    const currentKbId = currentKb._id;

    const newIds = finalDrillIdsRaw.filter(item => {
      // Keep if it belongs to ANOTHER KB
      if (typeof item === 'string') {
        return !isPrimary;
      } else {
        return item.kbId !== currentKbId;
      }
    });

    await setFinalDrillIdsRaw(newIds);
    setShowClearAllConfirm(false);
  };

  // --- Edit Mode Logic ---
  const [editingRemId, setEditingRemId] = useState<string | null>(null);

  const startEditing = async (which: 'current' | 'previous') => {
    const key = which === 'current' ? "finalDrillCurrentCardId" : "finalDrillPreviousCardId";
    const cardId = await plugin.storage.getSession<string>(key);
    if (!cardId) {
      await plugin.app.toast(`No ${which} card found to edit.`);
      return;
    }
    const card = await plugin.card.findOne(cardId);
    if (card && card.remId) {
      setEditingRemId(card.remId);
    } else {
      await plugin.app.toast(`Could not find Rem for card ${cardId}`);
    }
  };

  const containerRef = React.useRef<HTMLDivElement>(null);

  // --- Sync Active State for Index ---
  useEffect(() => {
    // Only signal Active if NOT blocked.
    // This prevents index.tsx from "seeing" the Final Drill when it's technically suppressed.
    plugin.storage.setSession("finalDrillActive", true);

    // Heartbeat: Signal we are alive every 2 seconds
    const heartbeatInterval = setInterval(() => {
      plugin.storage.setSession("finalDrillHeartbeat", Date.now());
    }, 2000);

    return () => {
      clearInterval(heartbeatInterval);
      plugin.storage.setSession("finalDrillActive", false);
    };
  }, [plugin]);


  // ... (omitted)

  // Render Editor Mode
  if (editingRemId) {
    return (
      <div
        className="h-full w-full flex flex-col"
        style={{
          backgroundColor: 'var(--rn-clr-background-primary)',
          color: 'var(--rn-clr-content-primary)'
        }}
      >
        {/* Header */}
        <div
          className="w-full flex justify-between items-center p-2 border-b flex-shrink-0"
          style={{
            borderColor: 'var(--rn-clr-border-primary)',
            backgroundColor: 'var(--rn-clr-background-secondary)'
          }}
        >
          <div className="flex flex-col">
            <span className="font-semibold text-lg px-2">Editing Card</span>
            <span className="text-xs px-2 font-mono" style={{ color: 'var(--rn-clr-content-tertiary)' }}>ID: {editingRemId}</span>
          </div>
          <div className="flex gap-2" style={{ paddingRight: '60px' }}>
            <button
              onClick={async () => {
                const rem = await plugin.rem.findOne(editingRemId);
                if (rem) {
                  await plugin.window.openRem(rem);
                  await plugin.storage.setSession("finalDrillResumeTrigger", Date.now());
                  await plugin.widget.closePopup();
                }
              }}
              className="px-3 py-1.5 rounded font-medium transition-colors"
              style={{
                color: 'var(--rn-clr-content-primary)',
                border: '1px solid var(--rn-clr-border-primary)',
                backgroundColor: 'var(--rn-clr-background-primary)'
              }}
            >
              Go to Rem
            </button>
            <button
              onClick={() => setEditingRemId(null)}
              className="px-3 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 font-medium transition-colors shadow-sm"
            >
              Done / Back to Drill
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow w-full overflow-hidden flex flex-col p-4 overflow-y-auto gap-6">

          {/* 1. Rem Content Editor */}
          <div className="flex-shrink-0">
            <div className="text-sm font-bold mb-2 px-2 uppercase tracking-wide" style={{ color: 'var(--rn-clr-content-secondary)' }}>
              Rem Content
            </div>
            <div className="border rounded-md p-2" style={{ borderColor: 'var(--rn-clr-border-primary)' }}>
              <RemRichTextEditor
                remId={editingRemId}
                width="100%"
              />
            </div>
          </div>

          {/* 2. Hierarchy Tree (Children) */}
          <div className="flex-grow flex flex-col min-h-[200px]">
            <div className="text-sm font-bold mb-2 px-2 uppercase tracking-wide" style={{ color: 'var(--rn-clr-content-secondary)' }}>
              Hierarchy / Details
            </div>
            <div className="flex-grow border rounded-md p-2" style={{ borderColor: 'var(--rn-clr-border-primary)' }}>
              <RemHierarchyEditorTree
                remId={editingRemId}
                width="100%"
                height="auto"
              />
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Standard Drill View
  if (showClearOldConfirm) {
    return (
      <div
        className="h-full w-full flex flex-col items-center justify-center p-4 text-center"
        style={{
          backgroundColor: 'var(--rn-clr-background-primary)',
          color: 'var(--rn-clr-content-primary)'
        }}
      >
        <h3 className="text-lg font-bold mb-2">Clear Old Items?</h3>
        <p className="mb-6 text-sm" style={{ color: 'var(--rn-clr-content-secondary)' }}>
          This will remove {oldItemsCount} items that have been in the queue for more than {oldItemThreshold} days. {filteredIds.length - oldItemsCount} items will remain.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setShowClearOldConfirm(false)}
            className="px-4 py-2 rounded transition-colors"
            style={{
              border: '1px solid var(--rn-clr-border-primary)',
              color: 'var(--rn-clr-content-primary)',
              backgroundColor: 'var(--rn-clr-background-secondary)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={clearOldItems}
            className="px-4 py-2 rounded text-white transition-colors"
            style={{ backgroundColor: '#ea5e5e' }}
          >
            Clear Old Items
          </button>
        </div>
      </div>
    );
  }

  if (showClearAllConfirm) {
    return (
      <div
        className="h-full w-full flex flex-col items-center justify-center p-4 text-center"
        style={{
          backgroundColor: 'var(--rn-clr-background-primary)',
          color: 'var(--rn-clr-content-primary)'
        }}
      >
        <h3 className="text-lg font-bold mb-2">Clear Final Drill Queue?</h3>
        <p className="mb-6 text-sm" style={{ color: 'var(--rn-clr-content-secondary)' }}>
          This will remove all {filteredIds.length} items from the final drill queue for this Knowledge Base.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setShowClearAllConfirm(false)}
            className="px-4 py-2 rounded transition-colors"
            style={{
              border: '1px solid var(--rn-clr-border-primary)',
              color: 'var(--rn-clr-content-primary)',
              backgroundColor: 'var(--rn-clr-background-secondary)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={clearAllItems}
            className="px-4 py-2 rounded text-white transition-colors"
            style={{ backgroundColor: '#ea5e5e' }}
          >
            Clear All
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="h-full w-full flex flex-col relative focus:outline-none"
    >
      {/* Confirmation Dialogs */}
      <div className="border-b rn-clr-border-primary flex flex-col">
        {/* Top Row: Title + Controls + Warning */}
        <div className="flex justify-between items-center p-2">
          {/* Left: Title + Standard Queue Controls */}
          <div className="flex gap-3 items-center">
            <span className="font-bold text-lg">Final Drill</span>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setShowClearAllConfirm(true)}
                className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                title="Clear all items from the Final Drill queue"
              >
                Clear Queue
              </button>
              <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                {filteredIds.length} Remaining
              </span>
            </div>
          </div>

          {/* Center/Right: Edit Buttons */}
          <div className="flex gap-2 items-center">
            {/* Go to Rem (Current) */}
            <button
              onClick={async () => {
                const cardId = await plugin.storage.getSession<string>("finalDrillCurrentCardId");
                if (cardId) {
                  const card = await plugin.card.findOne(cardId);
                  if (card && card.remId) {
                    const rem = await plugin.rem.findOne(card.remId);
                    if (rem) {
                      await plugin.window.openRem(rem);
                      await plugin.storage.setSession("finalDrillResumeTrigger", Date.now()); // Signal Notification
                      await plugin.widget.closePopup();
                    }
                  }
                }
              }}
              className="px-3 py-1.5 text-sm rounded transition-colors shadow-sm font-medium"
              style={{
                backgroundColor: 'var(--rn-clr-background-primary)',
                color: 'var(--rn-clr-content-primary)',
                border: '1px solid var(--rn-clr-border-primary)'
              }}
              title="Go to the current Rem (closes popup)"
            >
              Go to Rem
            </button>

            {/* Edit Later - Marks card for editing and removes from drill */}
            <button
              onClick={async () => {
                const cardId = await plugin.storage.getSession<string>("finalDrillCurrentCardId");
                if (cardId) {
                  const card = await plugin.card.findOne(cardId);
                  if (card && card.remId) {
                    const rem = await plugin.rem.findOne(card.remId);
                    if (rem) {
                      // Add EditLater powerup
                      await rem.addPowerup(BuiltInPowerupCodes.EditLater);
                      // Remove from Final Drill queue (synced storage)
                      const getCardId = (item: FinalDrillItem) => typeof item === 'string' ? item : item.cardId;
                      const newIds = finalDrillIdsRaw.filter(item => getCardId(item) !== cardId);
                      await setFinalDrillIdsRaw(newIds);
                      // Advance to the next card without remounting the Queue (preserves session)
                      await plugin.queue.removeCurrentCardFromQueue(false);
                      await plugin.app.toast("Card marked for Edit Later and removed from drill.");
                    }
                  }
                } else {
                  await plugin.app.toast("No current card found.");
                }
              }}
              className="px-3 py-1.5 text-sm rounded bg-orange-500 text-white hover:bg-orange-600 font-medium transition-colors shadow-md"
              title="Mark for Edit Later and remove from drill"
            >
              Edit Later
            </button>

            <button
              onClick={() => startEditing('previous')}
              className="px-3 py-1.5 text-sm rounded font-medium transition-colors shadow-sm"
              style={{
                backgroundColor: 'var(--rn-clr-background-secondary)',
                color: 'var(--rn-clr-content-primary)',
                border: '1px solid var(--rn-clr-border-primary)'
              }}
              title="Edit the card you just rated"
            >
              Edit Previous
            </button>
            <button
              onClick={() => startEditing('current')}
              className="px-3 py-1.5 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 font-medium transition-colors shadow-sm"
              title="Edit the currently visible card"
            >
              Edit Current
            </button>
          </div>

          {/* Right: Old Items Warning */}
          {oldItemsCount > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <span className="text-xs text-yellow-800 dark:text-yellow-200">
                {oldItemsCount} &gt; {oldItemThreshold} days.
              </span>
              <button
                onClick={() => setShowClearOldConfirm(true)}
                className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 dark:border-yellow-600"
              >
                Clear Old
              </button>
            </div>
          )}
        </div>

        {/* Bottom Row: Description */}
        <div className="px-2 pb-2 flex flex-col gap-0.5">
          <span className="text-sm px-2">Deliberately practice again your poorly rated flashcards.</span>
          <span className="text-xs px-2 text-gray-500 dark:text-gray-400">
            Flashcards you have rated <i>Again</i> or <i>Hard</i> will appear in the Final Drill and will remain here until you rate them <i>Good</i> or better.
          </span>
        </div>
      </div>

      <div className="flex-grow relative">
        <Queue
          key={queueKey}
          cardIds={filteredIds}
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
}

renderWidget(FinalDrill);