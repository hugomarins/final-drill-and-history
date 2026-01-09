import React, { useEffect, useState } from "react";
import {
    RemViewer,
    renderWidget,
    usePlugin,
    useSyncedStorageState,
    useSessionStorageState,
} from "@remnote/plugin-sdk";
import { timeSince } from "../lib/utils";

// Define the data structure for a practiced queue session
export interface PracticedQueueSession {
    id: string; // Unique ID for the session
    startTime: number;
    endTime?: number;
    queueId?: string; // subQueueId (Rem ID of the scope)
    scopeName?: string;
    kbId?: string; // Add kbId back

    // Metrics
    totalTime: number; // ms
    flashcardsCount: number;
    flashcardsTime: number; // ms
    incRemsCount: number;
    incRemsTime: number; // ms
}


const NUM_TO_LOAD_IN_BATCH = 20;

function PracticedQueues() {
    const plugin = usePlugin();
    const [historyRaw, setHistory] = useSyncedStorageState<PracticedQueueSession[]>(
        "practicedQueuesHistory",
        []
    );
    const [activeSession] = useSessionStorageState<PracticedQueueSession | null>("activeQueueSession", null);

    const [filteredData, setFilteredData] = useState<PracticedQueueSession[]>([]);

    useEffect(() => {
        async function filterData() {
            const currentKb = await plugin.kb.getCurrentKnowledgeBaseData();
            const currentKbId = currentKb._id;

            // Filter by current KB
            const filtered = historyRaw.filter((item) => {
                if (!item.kbId) return true; // Legacy/fallback
                return item.kbId === currentKbId;
            });
            setFilteredData(filtered);
        }
        filterData();
    }, [historyRaw, plugin]);

    const [numLoaded, setNumLoaded] = React.useState(1);

    // Reset pagination when data changes significantly
    useEffect(() => {
        setNumLoaded(1);
    }, [filteredData.length]);

    const numUnloaded = Math.max(
        0,
        filteredData.length - NUM_TO_LOAD_IN_BATCH * numLoaded
    );

    const deleteItem = (id: string) => {
        const idx = historyRaw.findIndex(x => x.id === id);
        if (idx !== -1) {
            historyRaw.splice(idx, 1);
            setHistory([...historyRaw]);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto rn-clr-background-primary">
            <div className="p-4">
                <h1 className="text-xl font-bold mb-4">Practiced Queues History</h1>

                {/* Live Session Summary */}
                {activeSession && (
                    <div className="mb-6">
                        <div className="uppercase text-xs font-bold rn-clr-content-tertiary mb-2 tracking-wider flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Active Session
                        </div>
                        <QueueSessionItem
                            session={activeSession}
                            isLive={true}
                            onDelete={() => { }} // No delete for live session
                        />
                        <div className="h-px w-full rn-clr-background-elevation-10 mt-6 md:mt-4"></div>
                    </div>
                )}

                {filteredData.length === 0 && (
                    <div className="rn-clr-content-secondary">
                        No practice sessions recorded yet.
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    {filteredData.slice(0, NUM_TO_LOAD_IN_BATCH * numLoaded).map((session) => (
                        <QueueSessionItem
                            key={session.id}
                            session={session}
                            onDelete={() => deleteItem(session.id)}
                        />
                    ))}
                </div>

                {numUnloaded > 0 && (
                    <button
                        onClick={() => setNumLoaded(n => n + 1)}
                        className="mt-4 w-full py-2 text-center text-blue-500 hover:text-blue-600 font-medium"
                    >
                        Load more ({numUnloaded})
                    </button>
                )}
            </div>
        </div>
    );
}

function QueueSessionItem({ session, onDelete, isLive }: { session: PracticedQueueSession, onDelete: () => void, isLive?: boolean }) {
    const plugin = usePlugin();
    // DEBUG LOG
    // console.log("DEBUG: Rendering Session Item", session);

    const formatTime = (ms: number) => {
        if (!ms) return "0s";
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    const handleOpen = async () => {
        if (session.queueId) {
            // Try to open the queue if possible (not directly supported by simple API, but we can try opening the Rem)
            // Ideally we'd valid if there is a way to launch the queue.
            // For now, let's open the document which is the "Scope".
            const rem = await plugin.rem.findOne(session.queueId);
            if (rem) {
                plugin.window.openRem(rem);
            } else {
                plugin.app.toast("Could not find the document for this queue.");
            }
        }
    }

    return (
        <div className={`p-3 border rounded-lg rn-clr-border-opaque hover:shadow-sm transition-shadow rn-clr-background-elevation-10 ${isLive ? 'border-green-500/30' : ''}`}>
            <div className="flex justify-between items-start">
                <div onClick={handleOpen} className="cursor-pointer flex-grow">
                    <div className="font-semibold text-lg hover:underline truncate" title={session.scopeName || "Ad-hoc Queue"}>
                        {session.scopeName ? session.scopeName : (session.queueId ? (
                            <RemViewer remId={session.queueId} width="100%" />
                        ) : "Ad-hoc Queue")}
                    </div>
                    <div className="text-sm rn-clr-content-secondary flex flex-col gap-1 mt-1">
                        <div className="flex gap-2 items-center">
                            <span className="rn-clr-background-secondary px-2 py-0.5 rounded text-xs" title="Total Time">
                                {formatTime(session.totalTime)}
                            </span>
                            <span>•</span>
                            <span>{session.flashcardsCount} Cards ({formatTime(session.flashcardsTime)})</span>
                            {session.incRemsCount > 0 && (
                                <>
                                    <span>•</span>
                                    <span>{session.incRemsCount} IncRems ({formatTime(session.incRemsTime)})</span>
                                </>
                            )}
                        </div>
                        <div className="text-xs rn-clr-content-tertiary">
                            Avg Speed: {session.flashcardsCount > 0 ? (session.flashcardsTime / session.flashcardsCount / 1000).toFixed(1) + 's/card' : '-'}
                        </div>
                    </div>
                    <div className="text-xs rn-clr-content-tertiary mt-1">
                        {isLive ? (<span className="text-green-600 font-medium">Active now</span>) : (`${timeSince(new Date(session.startTime))} ago`)}
                    </div>
                </div>
                {!isLive && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="rn-clr-content-tertiary hover:text-red-500 p-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    )
}

renderWidget(PracticedQueues);
