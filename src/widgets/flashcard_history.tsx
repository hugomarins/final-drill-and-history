import React, { useEffect } from "react";
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

interface FlashcardHistoryData {
  key: number;
  remId: RemId;
  cardId: string;
  time: number;
  open?: boolean; // UI state for showing the tree
}

function FlashcardHistory() {
  const [historyData, setHistoryData] = useSyncedStorageState<FlashcardHistoryData[]>(
    "flashcardHistoryData",
    []
  );

  const closeIndex = (index: number) => {
    historyData.splice(index, 1);
    setHistoryData([...historyData]);
  };

  const setData = (index: number, changes: Partial<FlashcardHistoryData>) => {
    const oldData = historyData[index];
    const newData = { ...oldData, ...changes };
    historyData.splice(index, 1, newData);
    setHistoryData([...historyData]);
  };

  const [numLoaded, setNumLoaded] = React.useState(1);

  useEffect(() => {
    setNumLoaded(1);
  }, [historyData.length]);

  const numUnloaded = Math.max(
    0,
    historyData.length - NUM_TO_LOAD_IN_BATCH * numLoaded
  );

  return (
    <div
      className="h-full overflow-y-auto rn-clr-background-primary"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="p-2 text-lg font-bold">Flashcard History</div>
      {historyData.length === 0 && (
        <div className="p-2 rn-clr-content-primary">
          Practice some flashcards to see your history here.
        </div>
      )}
      {historyData.slice(0, NUM_TO_LOAD_IN_BATCH * numLoaded).map((data, i) => (
        <HistoryItem
          data={data}
          remId={data.remId}
          key={data.key || Math.random()}
          setData={(c) => setData(i, c)}
          closeIndex={() => closeIndex(i)}
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

// Reusing the item structure from the original plugin
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
           {/* Simple chevron logic using standard chars or images if available */}
           <span>{data.open ? "▼" : "▶"}</span>
        </div>
        <div className="flex-grow min-w-0" onClick={() => openRem(remId)}>
          <RemViewer
            remId={remId}
            constraintRef="parent"
            maxWidth="100%"
            className="font-semibold cursor-pointer line-clamp-2"
          />
          <div className="text-xs rn-clr-content-tertiary">
            Seen {timeSince(new Date(data.time))}
          </div>
        </div>
        <div
          className="flex items-center justify-center flex-shrink-0 w-6 h-6 rounded-md cursor-pointer hover:bg-red-100"
          onClick={closeIndex}
        >
          <span>×</span>
        </div>
      </div>
      {data.open && (
        <div className="m-2">
          <RemHierarchyEditorTree height="expand" width="100%" remId={remId} />
        </div>
      )}
    </div>
  );
}

renderWidget(FlashcardHistory);