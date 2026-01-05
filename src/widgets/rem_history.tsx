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

const NUM_TO_LOAD_IN_BATCH = 20;
export interface RemHistoryData {
  key: number;
  remId: RemId;
  open: boolean;
  time: number;
  kbId?: string; // Added kbId
}

function RightSidebar2() {
  const plugin = usePlugin();
  const [remDataRaw, setRemData] = useSyncedStorageState<RemHistoryData[]>(
    "remData",
    []
  );
  
  const [filteredRemData, setFilteredRemData] = useState<RemHistoryData[]>([]);

  useEffect(() => {
    async function filterData() {
      const currentKb = await plugin.kb.getCurrentKnowledgeBaseData();
      const isPrimary = await plugin.kb.isPrimaryKnowledgeBase();
      const currentKbId = currentKb._id;

      const filtered = remDataRaw.filter((item) => {
        if (!item.kbId) {
          // Legacy: Include if this is the Primary KB
          return isPrimary;
        }
        // New: Include if KB ID matches
        return item.kbId === currentKbId;
      });
      setFilteredRemData(filtered);
    }
    filterData();
  }, [remDataRaw, plugin]);

  const closeIndex = (itemKey: number) => {
    const originalIndex = remDataRaw.findIndex(x => x.key === itemKey);
    if (originalIndex !== -1) {
      remDataRaw.splice(originalIndex, 1);
      setRemData([...remDataRaw]);
    }
  };

  const setData = (itemKey: number, changes: Partial<RemHistoryData>) => {
    const originalIndex = remDataRaw.findIndex(x => x.key === itemKey);
    if (originalIndex !== -1) {
      const oldData = remDataRaw[originalIndex];
      const newData = { ...oldData, ...changes };
      remDataRaw.splice(originalIndex, 1, newData);
      setRemData([...remDataRaw]);
    }
  };

  const [numLoaded, setNumLoaded] = React.useState(1);

  useEffect(() => {
    setNumLoaded(1);
  }, [filteredRemData.length]);

  const numUnloaded = Math.max(
    0,
    filteredRemData.length - NUM_TO_LOAD_IN_BATCH * numLoaded
  );

  return (
    <div
      className="h-full w-full overflow-y-auto rn-clr-background-primary"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="p-2 text-lg font-bold">Visited Rem History</div>
      {filteredRemData.length == 0 && (
        <div className="rn-clr-content-primary">
          Navigate to other documents to automatically record history.
        </div>
      )}
      {filteredRemData.slice(0, NUM_TO_LOAD_IN_BATCH * numLoaded).map((data, i) => (
        <RemHistoryItem
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
          className="pb-[200px]"
        >
          {" "}
          Load more{" "}
          <span className="rn-clr-content-secondary">({numUnloaded})</span>
        </div>
      )}
    </div>
  );
}

// ... RemHistoryItem interface and component remain unchanged ...
interface RemHistoryItemProps {
  data: RemHistoryData;
  remId: string;
  setData: (changes: Partial<RemHistoryData>) => void;
  closeIndex: () => void;
}

function RemHistoryItem({
  data,
  remId,
  setData,
  closeIndex,
}: RemHistoryItemProps) {
  const plugin = usePlugin();

  const openRem = async (remId: RemId) => {
    const rem = await plugin.rem.findOne(remId);
    if (rem) {
      plugin.window.openRem(rem);
    }
  };

  return (
    <div className="px-1 py-4 w-full" key={remId}>
      <div className="flex gap-2 mb-2">
        <div
          className="flex items-center justify-center flex-shrink-0 w-6 h-6 rounded-md cursor-pointer hover:rn-clr-background--hovered"
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
        {/* min-w-0 prevents overflow */}
        <div className="flex-grow min-w-0" onClick={() => openRem(remId)}>
          <RemViewer
            remId={remId}
            constraintRef="parent"
            width="100%"
            className="font-medium cursor-pointer line-clamp-2"
          />
          <div className="text-xs rn-clr-content-tertiary">
            {timeSince(new Date(data.time))}
          </div>
        </div>
        <div
          className="flex items-center justify-center flex-shrink-0 w-6 h-6 rounded-md cursor-pointer hover:rn-clr-background--hovered"
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
        <div className="m-2" style={{ borderBottomWidth: 1 }}>
          <RemHierarchyEditorTree height="auto" width="100%" remId={remId} />
        </div>
      )}
    </div>
  );
}

renderWidget(RightSidebar2);