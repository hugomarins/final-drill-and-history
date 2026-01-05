# Final Drill & History

This plugin extends the standard RemNote History functionality with two powerful study tools: a history of reviewed flashcards and a "Final Drill" queue for targeting difficult material.

## Features

### 1. Visited Rem History
- **What it does:** Records a chronological history of the Rems you have navigated to in the Editor.
- **Why use it:** Quickly jump back to documents you were just working on without losing your place.
- **Interaction:** You can expand and edit the Rem directly in the right sidebar.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/rem-history-editing.gif)

### 2. Flashcard History
- **What it does:** Records the chronological history of the Rems associated with the flashcards you have just seen in the Flashcard Queue.
- **Why use it:** If you want to check context or edit a flashcard you just reviewed, you can easily find it here without interrupting your session flow.
![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/flashcard-history.png)

### 3. Final Drill
- **What it does:** Implements a "Final Drill" queue inspired by SuperMemo. 
- **How it works:** 
    - Any flashcard you rate as **Forgot** or **Hard** is automatically added to the Final Drill queue.
    - These cards stay in this separate queue until you rate them **Good** or **Easy** inside the Final Drill widget.
- **Why use it:** Use this at the end of your learning day to review only the items you struggled with, ensuring you master them before finishing your session.

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill.png)

![](https://raw.githubusercontent.com/hugomarins/final-drill-and-history/main/images/final-drill-and-history.gif)

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

### v. 0.0.2 January 05th, 2026

- Plugin features (Rem History, Flashcard History and Final Drill) are now Knowledge Base aware (you can use multiple KBs, and the widgets will show the data of the current selected KB only).

### v. 0.0.1 January 04th, 2026

- Initial release.