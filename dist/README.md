# Final Drill & History

🇪🇸 [Español](https://github.com/hugomarins/final-drill-and-history/blob/main/README_ES.md) | 🇧🇷 [Português Brasileiro](https://github.com/hugomarins/final-drill-and-history/blob/main/README_PT-BR.md)

This plugin extends the official RemNote History plugin functionality with two powerful study tools: a history of reviewed flashcards and a "Final Drill" queue for targeting difficult material.

## Features

### 1. Visited Rem History
- **What it does:** Records a chronological history of the Rems you have navigated to in the Editor.
- **Why use it:** Quickly jump back to documents you were just working on without losing your place.
- **Interaction:** You can expand and edit the Rem directly in the right sidebar.
- **Search:** Includes a search bar to instantly filter your history. Supports multi-word queries (e.g., "Biology Exam") and deep text search across all recorded items.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/rem-history-editing.gif)

### 2. Flashcard History
- **What it does:** Records the chronological history of the Rems associated with the flashcards you have just seen in the Flashcard Queue.
- **Why use it:** If you want to check context or edit a flashcard you just reviewed, you can easily find it here without interrupting your session flow.
- **Interaction:** Clicking on a flashcard will open the rem in the Editor.
- **Search:** Effortlessly find a card you practiced moments or days ago. The search checks both the front (question) and back (answer/context) of your cards.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/flashcard-history.png)

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/filter.gif)


### 3. Practiced Queues History
- **What it does:** Tracks your practice sessions and metrics. 
- **Metrics Collected:** 
    - Total time spent studying.
    - Number of Flashcards reviewed and time spent on them.
    - Number of "Incremental Rems" (from Incremental Everything plugin) processed and time spent on them.
    - Average speed per card.
- **Why use it:** Gain insights into your study habits, track your velocity, and monitor your usage of incremental reading tools alongside standard flashcards.
- **Interaction:** Clicking on a session will open the document in the Editor, so that you can review the material again.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/queue-history.png)

### 4. Final Drill
- **What it does:** Implements a "Final Drill" queue inspired by SuperMemo. 
- **How it works:** 
    - Any flashcard you rate as **Forgot** or **Hard** is automatically added to the Final Drill queue.
      - **Forgot** usually already have a relearning step. If you do this relearning step successfully, the card will be cleared from the Final Drill queue; if not, doing it in the Final Drill will be the same as doing it away from it. The purpose of having these cards in the drill is to ensure you accomplish the relearning step (in case you usually make flashcards in document queues rather than in the global queue).
      - **Hard** is what brings the real difference. Drilling these cards is as if you were reviewing ahead of time; algorithms (especially FSRS) account for that, and the interval rendered will be practically the same as the one already assigned. The purpose of having them in the drill is to ensure you have raised retrievability close to 100% (the same purpose of the relearning step for forgotten items).
      - Unlike _SuperMemo_, these reviews will be recorded in your repetition history.
    - These cards stay in this separate queue until you rate them **Good** or **Easy** inside the Final Drill widget.
- **Why use it:** Use this at the end of your learning day (or whenever you are in the mood for it) to review only the items you struggled with recently, ensuring you master them before finishing your session. It is designed to ensure you have raised retrievability of the most difficult material close to 100% (in other words, that you have ingrained the content and knows it).
- **Do I have to use it?:** Have in mind that this is an optional stage of the learning process. Not using it will not bring negative consequences for your learning process, as in the next scheduled repetition, you'll be tested again, and failures will be treated accordingly by the algorithm. But using the drill will not cost much and will increase the chances of success in the subsequent repetitions.
- **Queue Management:**
    - **Old Items:** If items linger in the queue for too long (default 7 days), a warning will appear. You can clear these stale items with a single click to keep your drill session focused on fresh material. The threshold can be configured in the plugin settings.
    - **Clear Queue:** A "Clear Queue" button allows you to empty the Final Drill queue at any time if you want to start fresh or simply declutter.
- **Know limitations:** irresponsive to keyboard shortcuts, and no access to Edit / Preview buttons. As a workaound, a Editor UI is accessible by buttons (as it is still limited, there is a "Go to Rem" button to jump to the Rem in RemNote native Editor).

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill.png)

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill-editor.png)

## How to Use

1. **Open the Right Sidebar**: The plugin installs three widgets in the right sidebar.
2. **Rem History Tab**: 
   - Navigate through your knowledge base as usual.
   - Click items in the list to navigate back to them.
3. **Flashcard History Tab**: 
   - Start a flashcard queue. As you rate cards, they will appear in this list.
   - Click on a rem to open it in the main editor.
4. **Final Drill Tab**: 
   - If you rate a card "Forgot" or "Hard" during your regular queue (or anywhere else), a red badge will appear on this tab indicating cards are pending.
   - Open the tab to practice these specific cards.
   - The queue will automatically clear as you master the cards (rate them Good/Easy).

## Developers

This plugin is a fork of the official RemNote History plugin, enhanced with Queue event listeners and synced storage implementation for the Final Drill logic.

If you are interested in building your own plugins, check out the official documentation, guides, and tutorials on the [RemNote Plugin Website](https://plugins.remnote.com/).

## Changelog

### v. 0.0.8 January 07th, 2026

- **Final Drill** now is shown in a popup. 
- **Know limitations:** irresponsive to keyboard shortcuts, and no access to Edit / Preview buttons. As a workaound, a Editor UI is accessible by buttons (as it is still limited, there is a "Go to Rem" button to jump to the Rem in RemNote native Editor). 

### v. 0.0.7 January 07th, 2026

- **Search Filter:** Added a powerful search bar to "Visited Rem History" and "Flashcard History".
    - Filter history items instantly by text.
    - Supports multi-word searches (prioritizes exact matches).
    - **Flashcard Context:** Search includes the **Back Text** (content) of your flashcards, making it easier to find items based on their answer or context.
    - **Backfill:** Existing history items are automatically updated in the background to include searchable text.

### v. 0.1.6 January 07th, 2026

- Solved a bug where the Final Drill could clash with the main queue.

### v. 0.1.4 January 06th, 2026

- **Practiced Queues History:**
    - Implemented metrics tracking, distinguishing between Regular Flashcards and Incremental Rems.
    - Implemented dashboard to view detailed breakdowns of Cards vs IncRems counts and times for each session.

### v. 0.1.3 January 06th, 2026

- **Final Drill Improvements:** 
    - Added a "Clear Queue" button to easy empty the drill queue.
    - Added an "Old Items" warning to help identify and clear stale items (added > 7 days ago).
    - Added a new setting to configure the "Old Items Threshold" (default: 7 days).

### v. 0.0.2 January 05th, 2026

- Plugin features (Rem History, Flashcard History and Final Drill) are now Knowledge Base aware (you can use multiple KBs, and the widgets will show the data of the current selected KB only).

### v. 0.0.1 January 04th, 2026

- Initial release.