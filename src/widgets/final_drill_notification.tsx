
import { renderWidget, usePlugin, useTrackerPlugin } from "@remnote/plugin-sdk";
import React, { useEffect, useState } from "react";

const MOTIVATIONAL_PHRASES = [
    "Deliberately practice the material you are struggling with.",
    "Drill your most difficult cards.",
    "Leave no blind spots - do your Final Drill.",
    "Mastery comes from attacking your weaknesses.",
    "Don't just review; intentionally improve.",
    "Turn your hardest cards into your easiest ones.",
    "Focus where it hurts—that's where the growth is.",
    "A smooth sea never made a skilled sailor.",
    "Final Drill: because \"good enough\" isn't.",
    "Sharpen the saw on your toughest concepts.",
    "Embrace the struggle; the learning happens here.",
    "Your future self will thank you for this drill.",
    "Precision practice for permanent retention.",
    "Don't dodge the hard questions. Conquer them.",
    "This is where the magic (and the memory) happens.",
    "Solidify your knowledge foundation.",
    "Close the gaps in your understanding.",
    "Hard cards today, easy recall tomorrow.",
    "Reviewing what you know is comfortable; drilling what you don't is effective.",
    "Takes less time than re-learning it later.",
    "Face your knowledge gaps head-on.",
    "Consistency in the hard stuff brings mastery.",
    "You can handle this. Drill it till you know it.",
    "Level up your weak stats.",
    "Final Drill is the gym for your brain.",
    "No more guessing. Know it for sure.",
    "The obstruction is the path.",
    "Transform confusion into clarity.",
    "Finish strong.",
    "Don't let these cards haunt your queue.",
    "Master the material you tend to forget.",
    "Efficient learning means targeting the unknowns.",
    "Strengthen the weakest link in your memory chain.",
    "Make it stick this time.",
    "Excellence is a habit. Drill it in.",
    "Identify. Attack. Overcome.",
    "Don't let the hard cards slide.",
];

export const FinalDrillNotification = () => {
    const plugin = usePlugin();
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [phrase, setPhrase] = useState("");

    // Settings and Data
    const settings = useTrackerPlugin(
        async (reactivePlugin) => {
            const disabled = await reactivePlugin.settings.getSetting("disable_final_drill_notification");
            const ids = (await reactivePlugin.storage.getSynced("finalDrillIds")) as (string | { cardId: string; kbId?: string })[] || [];

            // Filter by Current KB
            const currentKb = await reactivePlugin.kb.getCurrentKnowledgeBaseData();
            const isPrimary = await reactivePlugin.kb.isPrimaryKnowledgeBase();
            const currentKbId = currentKb?._id;

            const count = ids.filter(item => {
                if (typeof item === 'string') {
                    // Legacy items belong to Primary KB
                    return isPrimary;
                } else {
                    // New items check KB ID
                    return item.kbId === currentKbId;
                }
            }).length;

            return { disabled, count };
        },
        []
    );

    // Pick a new phrase whenever we become visible
    useEffect(() => {
        if (visible) {
            const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length);
            setPhrase(MOTIVATIONAL_PHRASES[randomIndex]);
        }
    }, [visible]);

    // Timer Logic: Trigger on Startup and every 2 hours
    useEffect(() => {
        // Startup trigger (delayed slightly to ensure load)
        const startupTimer = setTimeout(() => {
            setDismissed(false);
            setVisible(true);
        }, 2000);

        // 2 Hour Interval
        const interval = setInterval(() => {
            setDismissed(false);
            setVisible(true);
        }, 2 * 60 * 60 * 1000); // 2 hours

        return () => {
            clearTimeout(startupTimer);
            clearInterval(interval);
        };
    }, []);

    if (!settings || settings.disabled || settings.count === 0 || dismissed) {
        return null;
    }

    // Use RemNote standard CSS variables for theme adaptation
    // https://plugins.remnote.com/custom-css
    const containerStyle = {
        backgroundColor: "var(--rn-clr-background-elevation-10)",
        border: "1px solid var(--rn-clr-border-subtle)",
        color: "var(--rn-clr-content-primary)",
        boxShadow: "var(--rn-box-shadow-1)",
    };

    const textStyle = {
        color: "var(--rn-clr-content-secondary)",
    };

    const phraseStyle = {
        color: "var(--rn-clr-content-tertiary)",
        fontStyle: "italic",
        fontSize: "0.85em",
        marginTop: "4px",
        marginBottom: "4px",
    };

    return (
        <div style={containerStyle} className="flex flex-col gap-2 p-3 rounded-lg mb-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/3534/3534117.png"
                        alt="Drill"
                        className="w-6 h-6"
                    />
                    <span className="font-semibold text-sm">Final Drill</span>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="hover:opacity-75"
                    style={{ color: "var(--rn-clr-content-tertiary)" }}
                >
                    ✕
                </button>
            </div>

            <div className="text-sm" style={textStyle}>
                <span className="font-bold" style={{ color: "#ef4444" }}>{settings.count}</span> cards waiting.
            </div>

            <div style={phraseStyle}>
                "{phrase}"
            </div>

            <button
                onClick={async () => {
                    await plugin.widget.openPopup("final_drill");
                    setDismissed(true);
                }}
                className="w-full py-1 px-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors"
            >
                Start Drill
            </button>
        </div>
    );
};

renderWidget(FinalDrillNotification);
