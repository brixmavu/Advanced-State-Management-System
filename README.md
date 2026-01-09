*⚙️✨ Advanced State Management System*

<p align="center">
  <img src="https://img.shields.io/badge/state-management-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/undo-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/real--time-sync-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/time--travel-enabled-orange?style=for-the-badge" />
</p>

> *A powerful, time-traveling, real-time, undo-friendly, collaborative state engine for modern apps.*

---

*💡 What is this wizardry?*

A *state management system* that tracks, syncs, and rewinds changes to your app’s data — like a *version-controlled brain* for your UI.

---

<details>
<summary>🔄 <strong>How It Works — The Magic Flow</strong></summary>

1. *🛠 Initialization*
   Starts with an initial state.
   _e.g., A survey form with pre-defined questions._

2. *✏️ Changes*
   Modify data → system tracks it → state updates automatically.

3. *↩️ Undo / 🔁 Redo*
   Navigate through change history like a time machine.

4. *🧩 Transactions*
   Group multiple changes into one atomic unit.
   If one fails, everything rolls back — no mess.

5. *🌐 Real-Time Sync*
   Multiple users? No problem.
   Changes sync across devices instantly.

6. *⏳ Time Travel*
   Every change is logged.
   Jump back to any previous state snapshot.

</details>

---

<details>
<summary>📘 <strong>Real-World Use Case: Collaborative Survey Editing</strong></summary>

Imagine you're co-editing a survey form:

- 🧑‍🤝‍🧑 Your teammate updates a question — you hit *Undo*.
- ✍️ You edit multiple fields — wrap them in a *Transaction* and *Commit*.
- 🔄 Your teammate makes changes — they *sync* with yours in real time.
- 🕰 Need to review an older version? Just *Time Travel* back.

> Perfect for *collaborative*, *reactive*, or *data-driven* apps where *reliability* and *history* matter.

</details>

---

<details>
<summary>🚀 <strong>Quick Start Guide</strong></summary>

*📦 Clone & Setup*

```bash
git clone https://github.com/brixmavu/Advanced-State-Management-System.git
cd advanced-state-manager
```

*📥 Import & Initialize*

```javascript
import AdvancedStateManager from './src/manager/AdvancedStateManager.js';

const initialState = {
  form: {
    title: 'Customer Survey',
    questions: [
      { id: 'q1', text: 'How satisfied are you with our service?', type: 'rating'},
      { id: 'q2', text: 'Would you recommend us to a friend?', type: 'boolean'}
    ]
}
};

const manager = new AdvancedStateManager(initialState, {
  debug: true,
  maxHistorySize: 20
});
```

</details>

---

<details>
<summary>🧰 <strong>Core API Methods</strong></summary>



MethodDescription`getState(path)`🔍 Get the current state or a specific slice`setState(updater, description)`✏️ Update the state with a description`subscribe(listener)`📡 Listen for state changes`unsubscribe(listener)`🔕 Stop listening`undo()`⬅️ Revert the last change`redo()`➡️ Reapply the last undone change`beginTransaction(description)`🧱 Start a transaction`commitTransaction()`✅ Commit a transaction`rollbackTransaction()`❌ Rollback a transaction`timeTravel(historyIndex)`⏮ Jump to a previous state</details>

---

<details>
<summary>🧪 <strong>Example in Action</strong></summary>

```javascript
manager.subscribe((newState) => {
  console.log('State updated:', newState);
});

manager.setState((state) => {
  state.form.title = 'Customer Feedback Form';
  return state;
}, 'Update form title');

manager.undo();  // ⬅️ Revert title change
manager.redo();  // ➡️ Reapply title change
```

</details>
