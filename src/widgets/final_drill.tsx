
import React, { useEffect, useState } from "react";
import {
  renderWidget,
  useSyncedStorageState,
  Queue,
  usePlugin,
  useTrackerPlugin,
  AppEvents,
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




  const isBlocked = useTrackerPlugin(async (reactivePlugin) => {
    return await reactivePlugin.storage.getSession<boolean>("finalDrillBlocked");
  }, [plugin]) ?? false;

  // --- Sync Active State for Index ---
  useEffect(() => {
    // Signal that Final Drill is open so index.tsx can name sessions correctly.
    plugin.storage.setSession("finalDrillActive", true);
    return () => {
      plugin.storage.setSession("finalDrillActive", false);
    }
  }, [plugin]);

  if (isBlocked) {
    return (
      <div className="h-full flex items-center justify-center p-4 text-center rn-clr-content-primary">
        <div>
          <h2 className="text-xl font-bold mb-2">Queue Active</h2>
          <p>You are currently practicing another queue. Please finish it before using Final Drill.</p>
        </div>
      </div>
    );
  }

  if (!filteredIds || filteredIds.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4 text-center rn-clr-content-primary">
        <div>
          <h2 className="text-xl font-bold mb-2">Final Drill Clear!</h2>
          <p>No cards rated "Hard" or "Forgot" are currently in the drill queue for this Knowledge Base.</p>
        </div>
      </div>
    );
  }

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
    <div className="h-full w-full flex flex-col relative">
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
          cardIds={filteredIds}
          width="100%"
          height="100%"
        />
      </div>


    </div>
  );
}

renderWidget(FinalDrill);