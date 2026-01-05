import React, { useEffect, useState } from "react";
import {
  RemHierarchyEditorTree,
  RemId,
  RemViewer,
  renderWidget,
  usePlugin,
  useSyncedStorageState,
} from "@remnote/plugin-sdk";
import { timeSince } from "../lib/utils";

const NUM_TO_LOAD_IN_BATCH = 50;

export interface FlashcardHistoryData {
  key: number;
  remId: RemId;
  cardId: string;
  time: number;
  open?: boolean;  // UI state for showing the tree
  kbId?: string; // Added kbId
}

function FlashcardHistory() {
  const plugin = usePlugin();
  const [historyDataRaw, setHistoryData] = useSyncedStorageState<FlashcardHistoryData[]>(
    "flashcardHistoryData",
    []
  );

  // Filtered data state
  const [filteredData, setFilteredData] = useState<FlashcardHistoryData[]>([]);

  // Effect to filter data by Knowledge Base
  useEffect(() => {
    async function filterData() {
      const currentKb = await plugin.kb.getCurrentKnowledgeBaseData();
      const isPrimary = await plugin.kb.isPrimaryKnowledgeBase();
      const currentKbId = currentKb._id;

      const filtered = historyDataRaw.filter((item) => {
        if (!item.kbId) {
          // Legacy: Include if this is the Primary KB
          return isPrimary;
        }
        // New: Include if KB ID matches
        return item.kbId === currentKbId;
      });
      setFilteredData(filtered);
    }
    filterData();
  }, [historyDataRaw, plugin]);

  // Note: We need to handle updates (delete/toggle) on the ORIGINAL list (historyDataRaw)
  // to persist changes correctly.

  const closeIndex = (itemKey: number) => {
    // Find index in original list
    const originalIndex = historyDataRaw.findIndex(x => x.key === itemKey);
    if (originalIndex !== -1) {
      historyDataRaw.splice(originalIndex, 1);
      setHistoryData([...historyDataRaw]);
    }
  };

  const setData = (itemKey: number, changes: Partial<FlashcardHistoryData>) => {
    const originalIndex = historyDataRaw.findIndex(x => x.key === itemKey);
    if (originalIndex !== -1) {
      const oldData = historyDataRaw[originalIndex];
      const newData = { ...oldData, ...changes };
      historyDataRaw.splice(originalIndex, 1, newData);
      setHistoryData([...historyDataRaw]);
    }
  };

  const [numLoaded, setNumLoaded] = React.useState(1);

  useEffect(() => {
    setNumLoaded(1);
  }, [filteredData.length]);

  const numUnloaded = Math.max(
    0,
    filteredData.length - NUM_TO_LOAD_IN_BATCH * numLoaded
  );

  return (
    <div
      className="h-full w-full overflow-y-auto rn-clr-background-primary"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="p-2 text-lg font-bold">Flashcard History</div>
      {filteredData.length === 0 && (
        <div className="p-2 rn-clr-content-primary">
          Practice some flashcards to see your history here.
        </div>
      )}
      {filteredData.slice(0, NUM_TO_LOAD_IN_BATCH * numLoaded).map((data) => (
        <HistoryItem
          data={data}
          remId={data.remId}
          key={data.key || Math.random()}
          setData={(c) => setData(data.key, c)}
          closeIndex={() => closeIndex(data.key)}
        />
      ))}
      {numUnloaded > 0 && (
        <div
          onMouseOver={() => setNumLoaded((i) => i + 1)}
          className="pb-[200px] p-2 cursor-pointer"
        >
          Load more <span className="rn-clr-content-secondary">({numUnloaded})</span>
        </div>
      )}
    </div>
  );
}

function HistoryItem({
  data,
  remId,
  setData,
  closeIndex,
}: {
  data: FlashcardHistoryData;
  remId: string;
  setData: (changes: Partial<FlashcardHistoryData>) => void;
  closeIndex: () => void;
}) {
  const plugin = usePlugin();

  const openRem = async (remId: RemId) => {
    const rem = await plugin.rem.findOne(remId);
    if (rem) {
      plugin.window.openRem(rem);
    }
  };

  return (
    <div className="px-1 py-4 border-b border-gray-100" key={data.key}>
      <div className="flex gap-2 mb-2">
        <div
          className="flex items-center justify-center flex-shrink-0 w-6 h-6 rounded-md cursor-pointer hover:bg-gray-200"
          onClick={() => setData({ open: !data.open })}
        >
          <img
            src={`${plugin.rootURL}chevron_down.svg`}
            style={{
              transform: `rotate(${data.open ? 0 : -90}deg)`,
              transitionProperty: "transform",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              transitionDuration: "150ms",
            }}
          />
        </div>
        <div className="flex-grow min-w-0" onClick={() => openRem(remId)}>
          <RemViewer
            remId={remId}
            constraintRef="parent"
            width="100%"
            className="font-light cursor-pointer line-clamp-2"
          />
          <div className="text-xs rn-clr-content-tertiary">
            Seen {timeSince(new Date(data.time))}
          </div>
        </div>
        <div
          className="flex items-center justify-center flex-shrink-0 w-6 h-6 rounded-md cursor-pointer hover:bg-red-100"
          onClick={closeIndex}
        >
          <img
            src={`${plugin.rootURL}close.svg`}
            style={{
              display: "inline-block",
              fill: "var(--rn-clr-content-tertiary)",
              color: "color",
              width: 16,
              height: 16,
            }}
          />
        </div>
      </div>
      {data.open && (
        <div className="m-2">
          <RemHierarchyEditorTree height="auto" width="100%" remId={remId} />
        </div>
      )}
    </div>
  );
}

renderWidget(FlashcardHistory);