import React, { useEffect, useState, useMemo } from "react";
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
    currentCardTotalTime?: number; // ms
    currentCardRepCount?: number;
}

interface AggregatedStats {
    label: string;
    sessions: PracticedQueueSession[];
    totalTime: number;
    cardsCount: number;
    cardsTime: number;
    incRemsCount: number;
    incRemsTime: number;
    retentionRate: number; // percentage 0-100
    avgSpeed: number; // cards per minute
}

const NUM_TO_LOAD_IN_BATCH = 20;

const formatTimeShort = (ms: number) => {
    if (!ms) return "0s";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
};

// --- Summary Logic ---

function getStartOfDay(date: Date) {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate.getTime();
}

function getStartOfWeek(date: Date) {
    const newDate = new Date(date);
    const day = newDate.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = newDate.getDate() - day + (day === 0 ? -6 : 1) - 1; // Start on Sunday? User said "This Week". Usually starts Sunday or Monday. Let's assume Sunday for simplicity.
    // Actually, let's stick to standard start of week (Sunday)
    const first = newDate.getDate() - day;
    newDate.setDate(first);
    newDate.setHours(0, 0, 0, 0);
    return newDate.getTime();
}

function getStartOfMonth(date: Date) {
    const newDate = new Date(date);
    newDate.setDate(1);
    newDate.setHours(0, 0, 0, 0);
    return newDate.getTime();
}

function getStartOfYear(date: Date) {
    const newDate = new Date(date);
    newDate.setMonth(0, 1);
    newDate.setHours(0, 0, 0, 0);
    return newDate.getTime();
}

function calculateStats(sessions: PracticedQueueSession[], label: string): AggregatedStats {
    let totalTime = 0;
    let cardsCount = 0;
    let cardsTime = 0;
    let incRemsCount = 0;
    let incRemsTime = 0;
    let totalForgot = 0; // for retention

    sessions.forEach(s => {
        totalTime += s.totalTime || 0;
        cardsCount += s.flashcardsCount || 0;
        cardsTime += s.flashcardsTime || 0;
        incRemsCount += s.incRemsCount || 0;
        incRemsTime += s.incRemsTime || 0;
        totalForgot += s.againCount || 0;
    });

    const totalRemembered = Math.max(0, cardsCount - totalForgot);
    const retentionRate = cardsCount > 0 ? (totalRemembered / cardsCount) * 100 : 0; // If 0 cards, 0 retention or N/A. Let's start with 0 or 100? Usually 0 if no practice.

    // Avg Speed = Total Cards / (Total Flashcard Time in Minutes)
    // Avoid division by zero
    const cardsTimeMin = cardsTime / 1000 / 60;
    const avgSpeed = cardsTimeMin > 0 ? cardsCount / cardsTimeMin : 0;

    return {
        label,
        sessions,
        totalTime,
        cardsCount,
        cardsTime,
        incRemsCount,
        incRemsTime,
        retentionRate,
        avgSpeed
    };
}

function SummaryTable({ allSessions }: { allSessions: PracticedQueueSession[] }) {
    const stats = useMemo(() => {
        const now = new Date();
        const startOfToday = getStartOfDay(now);
        const startOfYesterday = startOfToday - 86400000;
        const startOfWeek = getStartOfWeek(now);
        const startOfLastWeek = startOfWeek - (7 * 24 * 60 * 60 * 1000);
        const startOfMonth = getStartOfMonth(now);
        const startOfYear = getStartOfYear(now);

        // Last Month logic: strict previous month
        const lastMonthDate = new Date(now);
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        const startOfLastMonth = getStartOfMonth(lastMonthDate);
        // End of last month is start of this month

        // Last Year logic
        const lastYearDate = new Date(now);
        lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
        const startOfLastYear = getStartOfYear(lastYearDate);
        // End of last year is start of this year

        const today = allSessions.filter(s => s.startTime >= startOfToday);
        const yesterday = allSessions.filter(s => s.startTime >= startOfYesterday && s.startTime < startOfToday);
        const thisWeek = allSessions.filter(s => s.startTime >= startOfWeek);
        const lastWeek = allSessions.filter(s => s.startTime >= startOfLastWeek && s.startTime < startOfWeek);
        const thisMonth = allSessions.filter(s => s.startTime >= startOfMonth);
        const lastMonth = allSessions.filter(s => s.startTime >= startOfLastMonth && s.startTime < startOfMonth);
        const thisYear = allSessions.filter(s => s.startTime >= startOfYear);
        const lastYear = allSessions.filter(s => s.startTime >= startOfLastYear && s.startTime < startOfYear);

        return [
            calculateStats(today, "Today"),
            calculateStats(yesterday, "Yesterday"),
            calculateStats(thisWeek, "This Week"),
            calculateStats(lastWeek, "Last Week"),
            calculateStats(thisMonth, "This Month"),
            calculateStats(lastMonth, "Last Month"),
            calculateStats(thisYear, "This Year"),
            calculateStats(lastYear, "Last Year"),
            calculateStats(allSessions, "Ever"),
        ];
    }, [allSessions]);

    return (
        <div className="mb-6 overflow-x-auto">
            <h2 className="text-sm font-bold uppercase rn-clr-content-tertiary mb-2 tracking-wider">Summary</h2>
            <div className="border rounded-lg overflow-hidden text-xs rn-clr-border-opaque">
                <table className="w-full text-left rn-clr-background-primary">
                    <thead className="rn-clr-background-secondary border-b rn-clr-border-opaque">
                        <tr>
                            <th className="p-2 font-bold rn-clr-content-secondary">Period</th>
                            <th className="p-2 font-bold rn-clr-content-secondary text-right">Time</th>
                            <th className="p-2 font-bold rn-clr-content-secondary text-right">Cards</th>
                            <th className="p-2 font-bold rn-clr-content-secondary text-right">Inc. Rems</th>
                            <th className="p-2 font-bold rn-clr-content-secondary text-right">Ret.</th>
                            <th className="p-2 font-bold rn-clr-content-secondary text-right">Speed</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y rn-clr-divide-opaque">
                        {stats.map((row) => (
                            <tr key={row.label} className="hover:rn-clr-background-secondary transition-colors">
                                <td className="p-2 font-medium rn-clr-content-primary">{row.label}</td>
                                <td className="p-2 text-right font-mono rn-clr-content-secondary">
                                    {row.totalTime > 0 ? formatTimeShort(row.totalTime) : "-"}
                                </td>
                                <td className="p-2 text-right">
                                    {row.cardsCount > 0 ? (
                                        <div>
                                            <span className="font-bold rn-clr-content-primary">{row.cardsCount}</span>
                                            <span className="rn-clr-content-tertiary text-[10px] ml-1">({formatTimeShort(row.cardsTime)})</span>
                                        </div>
                                    ) : <span className="rn-clr-content-tertiary">-</span>}
                                </td>
                                <td className="p-2 text-right">
                                    {row.incRemsCount > 0 ? (
                                        <div>
                                            <span className="font-bold rn-clr-content-primary">{row.incRemsCount}</span>
                                            <span className="rn-clr-content-tertiary text-[10px] ml-1">({formatTimeShort(row.incRemsTime)})</span>
                                        </div>
                                    ) : <span className="rn-clr-content-tertiary">-</span>}
                                </td>
                                <td className="p-2 text-right">
                                    {row.cardsCount > 0 ? (
                                        <span className={row.retentionRate >= 90 ? "text-green-600 font-bold" : (row.retentionRate < 80 ? "text-red-500 font-bold" : "text-yellow-600 font-bold")}>
                                            {row.retentionRate.toFixed(0)}%
                                        </span>
                                    ) : <span className="rn-clr-content-tertiary">-</span>}
                                </td>
                                <td className="p-2 text-right">
                                    {row.cardsCount > 0 ? (
                                        <span><span className="rn-clr-content-primary">{row.avgSpeed.toFixed(1)}</span> <span className="rn-clr-content-tertiary text-[10px]">cpm</span></span>
                                    ) : <span className="rn-clr-content-tertiary">-</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

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

                {/* Statistics Summary */}
                <SummaryTable allSessions={filteredData} />

                {filteredData.length === 0 ? (
                    <div className="rn-clr-content-secondary">
                        No practice sessions recorded yet.
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="uppercase text-xs font-bold text-gray-400 mb-2 tracking-wider">History Log</div>
                        {filteredData.slice(0, NUM_TO_LOAD_IN_BATCH * numLoaded).map((session) => (
                            <QueueSessionItem
                                key={session.id}
                                session={session}
                                onDelete={() => deleteItem(session.id)}
                            />
                        ))}
                    </div>
                )}

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
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span title="Total Review Time" className="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    {session.currentCardTotalTime !== undefined ? formatTime(session.currentCardTotalTime) : '-'}
                                </span>
                                <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
                                <span title="Total Repetitions">
                                    {session.currentCardRepCount !== undefined ? `${session.currentCardRepCount} reps` : '-'}
                                </span>
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
