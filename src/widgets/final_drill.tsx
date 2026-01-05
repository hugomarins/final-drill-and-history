import React, { useEffect, useState } from "react";
import {
  renderWidget,
  useSyncedStorageState,
  Queue,
  usePlugin, // Added usePlugin
} from "@remnote/plugin-sdk";

// Define the mixed type here as well
type FinalDrillItem = string | { cardId: string; kbId?: string };

function FinalDrill() {
  const plugin = usePlugin();
  // Access the synced list (now using the mixed type)
  const [finalDrillIdsRaw] = useSyncedStorageState<FinalDrillItem[]>("finalDrillIds", []);
  
  // State for IDs filtered by current KB
  const [filteredIds, setFilteredIds] = useState<string[]>([]);

  useEffect(() => {
    async function filterByKb() {
      // Fetch KB Metadata
      const currentKb = await plugin.kb.getCurrentKnowledgeBaseData();
      const isPrimary = await plugin.kb.isPrimaryKnowledgeBase();
      const currentKbId = currentKb._id;

      const relevantIds = finalDrillIdsRaw.reduce<string[]>((acc, item) => {
        if (typeof item === 'string') {
          // Legacy Item: Include only if we are in the Primary KB
          if (isPrimary) acc.push(item);
        } else {
          // New Item: Include only if KB ID matches
          if (item.kbId === currentKbId) acc.push(item.cardId);
        }
        return acc;
      }, []);

      setFilteredIds(relevantIds);
    }

    if (plugin) {
      filterByKb();
    }
  }, [finalDrillIdsRaw, plugin]);

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

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-2 border-b rn-clr-border-primary flex justify-between items-center">
        <span className="font-bold text-lg">Final Drill</span>
        <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
          {filteredIds.length} Remaining
        </span>
      </div>
      <div className="p-2 border-b rn-clr-border-primary flex flex-col gap-1">
        <span className="text-sm px-2 py-1">Deliberately practice again your poorly rated flashcards.</span>
        <span className="text-xs px-2 py-1">Flashcards you have rated <i>Again</i> or <i>Hard</i> will appear in the Final Drill and will remain here until you rate them <i>Good</i> or better.</span>
      </div>
      
      {/* The Queue component in controlled mode. 
        When you rate a card here, AppEvents.QueueCompleteCard will fire globally.
        Our listener in index.tsx will catch that event and remove the card 
        from finalDrillIds if you score it Good or Easy.
      */}
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