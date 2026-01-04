import React from "react";
import {
  renderWidget,
  useSyncedStorageState,
  Queue, 
} from "@remnote/plugin-sdk";

function FinalDrillPane() {
  const [finalDrillIds] = useSyncedStorageState<string[]>("finalDrillIds", []);

  // Empty State
  if (!finalDrillIds || finalDrillIds.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4 text-center rn-clr-content-primary">
        <div>
          <h2 className="text-3xl font-bold mb-4">Final Drill Clear! 🎉</h2>
          <p className="text-lg">No cards rated "Hard" or "Forgot" are currently in the queue.</p>
        </div>
      </div>
    );
  }

  // Queue State
  return (
    <div className="h-full w-full flex flex-col rn-clr-background-primary">
      <div className="p-4 border-b rn-clr-border-primary flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Final Drill Practice</h1>
          <p className="text-sm rn-clr-content-secondary">
             Reviewing items you scored <b>Again</b> or <b>Hard</b>.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-bold">
          {finalDrillIds.length} Remaining
        </span>
      </div>
      
      <div className="flex-grow relative w-full h-full">
         <Queue 
           cardIds={finalDrillIds} 
           width="100%" 
           height="100%" 
         />
      </div>
    </div>
  );
}

renderWidget(FinalDrillPane);