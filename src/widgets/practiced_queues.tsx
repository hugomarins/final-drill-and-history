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
    againCount: number; // For Retention Rate (Forgot count)
    currentCardAge?: number; // Timestamp of the FIRST repetition (creation date), strictly for live view
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

    const formatAge = (firstRepTime?: number) => {
        if (!firstRepTime) return "New";
        const diff = Date.now() - firstRepTime;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (years > 0) return `${years}.${Math.floor((days % 365) / 30)}y`; // e.g. 1.5y
        if (months > 0) return `${months}.${Math.floor(days % 30 / 3)}m`; // e.g. 5.1m (approx)
        if (days > 0) return `${days}d`;
        return "New";
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

    // Metrics Calculation
    const seconds = session.flashcardsTime / 1000;
    const count = session.flashcardsCount;

    // Cards Per Minute = (count / seconds) * 60
    const cardsPerMinVal = count > 0 && seconds > 0 ? (count / seconds) * 60 : 0;
    const cardsPerMin = count > 0 && seconds > 0 ? cardsPerMinVal.toFixed(1) : '-';

    const avgSpeedSeconds = count > 0 ? (seconds / count).toFixed(1) : '-';

    // Retention Logic
    const forgotCount = session.againCount || 0;
    const rememberedCount = Math.max(0, count - forgotCount);
    // Retention Rate: 100% if count is 0
    const retentionRate = count > 0 ? ((rememberedCount / count) * 100).toFixed(0) : "100";

    // Color Logic for Speed
    // Red (< 1.5) -> Green (> 4). Range = 2.5
    // Hue: 0 (Red) -> 120 (Green)
    let hue = 0;
    if (count > 0 && seconds > 0) {
        if (cardsPerMinVal < 1.5) {
            hue = 0; // Red
        } else if (cardsPerMinVal >= 4) {
            hue = 120; // Green
        } else {
            // Interpolate
            const ratio = (cardsPerMinVal - 1.5) / (4 - 1.5);
            hue = Math.floor(ratio * 120);
        }
    }
    const speedColor = { color: count > 0 ? `hsl(${hue}, 90%, 35%)` : '' };

    // Color Logic for Retention
    const retentionVal = parseInt(retentionRate);
    const retentionColor = retentionVal >= 90 ? "text-green-600" : (retentionVal < 80 ? "text-red-500" : "text-yellow-600");

    if (isLive) {
        return (
            <div className="p-4 border-l-4 border-green-500 bg-green-500/5 rounded-r-lg shadow-sm mb-4">
                <div onClick={handleOpen} className="cursor-pointer">
                    <div className="font-bold text-xl mb-3 truncate" title={session.scopeName || "Ad-hoc Queue"}>
                        {session.scopeName ? session.scopeName : (session.queueId ? (
                            <RemViewer remId={session.queueId} width="100%" />
                        ) : "Ad-hoc Queue")}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Time */}
                        <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                            <div className="text-xs uppercase font-bold text-gray-500 mb-1">Time</div>
                            <div className="text-2xl font-mono font-semibold">{formatTime(session.totalTime)}</div>
                        </div>

                        {/* Speed */}
                        <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                            <div className="text-xs uppercase font-bold text-gray-500 mb-1">Speed</div>
                            <div className="flex flex-col">
                                <div className="text-2xl font-bold" style={speedColor}>
                                    {cardsPerMin}<span className="text-sm font-normal ml-1">cpm</span>
                                </div>
                                <div className="text-xs text-gray-400">
                                    {avgSpeedSeconds} s/card
                                </div>
                            </div>
                        </div>

                        {/* Retention (Live) */}
                        <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                            <div className="text-xs uppercase font-bold text-gray-500 mb-1">Retention</div>
                            <div className="flex flex-col">
                                <div className={`text-2xl font-bold ${retentionColor}`}>
                                    {retentionRate}<span className="text-sm font-normal ml-1">%</span>
                                </div>
                                <div className="text-xs font-semibold text-gray-500">
                                    <span className="text-green-600">{rememberedCount}</span>
                                    <span className="mx-1">/</span>
                                    <span className="text-red-500">{forgotCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Card Age (Only Live) */}
                        <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                            <div className="text-xs uppercase font-bold text-gray-500 mb-1">Card Age</div>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {formatAge(session.currentCardAge)}
                            </div>
                        </div>

                        <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                            <div className="text-xs uppercase font-bold text-gray-500 mb-1">Cards</div>
                            <div className="text-xl font-semibold">
                                {count} <span className="text-xs font-normal text-gray-400">({formatTime(session.flashcardsTime)})</span>
                            </div>
                        </div>
                        {session.incRemsCount > 0 && (
                            <div className="bg-white/50 dark:bg-black/20 p-2 rounded">
                                <div className="text-xs uppercase font-bold text-gray-500 mb-1">Inc. Rems</div>
                                <div className="text-xl font-semibold">
                                    {session.incRemsCount} <span className="text-xs font-normal text-gray-400">({formatTime(session.incRemsTime)})</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-green-600 font-medium mt-3 flex items-center gap-1">
                        <span className="relative flex h-2 w-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Recording Live...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 border rounded-lg rn-clr-border-opaque hover:shadow-sm transition-shadow rn-clr-background-elevation-10">
            <div className="flex justify-between items-start">
                <div onClick={handleOpen} className="cursor-pointer flex-grow">
                    <div className="font-semibold text-lg hover:underline truncate" title={session.scopeName || "Ad-hoc Queue"}>
                        {session.scopeName ? session.scopeName : (session.queueId ? (
                            <RemViewer remId={session.queueId} width="100%" />
                        ) : "Ad-hoc Queue")}
                    </div>
                    <div className="text-sm rn-clr-content-secondary flex flex-col gap-1 mt-1">
                        <div className="flex flex-wrap gap-3 items-center">
                            <span className="rn-clr-background-secondary px-2 py-0.5 rounded text-xs font-mono" title="Total Time">
                                {formatTime(session.totalTime)}
                            </span>

                            {/* Cards Count */}
                            <span>{session.flashcardsCount} Cards ({formatTime(session.flashcardsTime)})</span>

                            {/* Retention Stats in History (Compact) */}
                            <div className="flex items-center gap-1 text-xs rn-clr-background-secondary px-1.5 py-0.5 rounded" title="Remembered / Forgot (Retention %)">
                                <span className="font-bold text-green-600">{rememberedCount}</span>
                                <span className="text-gray-400">/</span>
                                <span className="font-bold text-red-500">{forgotCount}</span>
                                <span className="ml-1 font-semibold text-gray-500">({retentionRate}%)</span>
                            </div>

                            {session.incRemsCount > 0 && (
                                <span>{session.incRemsCount} IncRems ({formatTime(session.incRemsTime)})</span>
                            )}
                        </div>
                        <div className="text-xs rn-clr-content-tertiary flex items-center gap-2 mt-1">
                            <span>Speed:</span>
                            <span className="font-bold" style={speedColor}>
                                {cardsPerMin} cpm
                            </span>
                            <span className="text-gray-400">
                                ({avgSpeedSeconds} s/card)
                            </span>
                        </div>
                    </div>
                    <div className="text-xs rn-clr-content-tertiary mt-1">
                        {`${timeSince(new Date(session.startTime))} ago`}
                    </div>
                </div>
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
            </div>
        </div>
    )
}

renderWidget(PracticedQueues);
