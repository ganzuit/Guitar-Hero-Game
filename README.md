# 🎸 Reactive Rhythm

*A Functional Reactive Guitar Hero–Style Game*

---

## 🎮 Overview

**Reactive Rhythm** is a browser-based rhythm game inspired by *Guitar Hero*, built using **Functional Reactive Programming (FRP)** principles.

The game uses **RxJS Observables** to handle real-time input, animation, and state management in a purely functional way.

---

## 🚀 Features

* 🎵 CSV-driven note generation
* ⏱️ Precise timing alignment with music
* 🎯 Score tracking (hits & misses)
* 🔥 Combo multiplier system
* 🎵 Background playback for non-player notes
* 🎼 Long note (tail) mechanics with hold detection
* ⚡ Fully reactive game loop using Observables

---

## 🧠 Functional Reactive Programming

This project demonstrates:

* Immutable state management
* Pure functions
* Stream-based event handling
* Declarative UI updates

Game flow:

```
User Input → Observable Streams → State → Render
```

---

## 🛠️ Tech Stack

* TypeScript
* RxJS
* SVG
* Tone.js

---

## ⚙️ Setup & Usage

### 📦 Install Dependencies

```bash
npm install
```

---

### 🧪 Run Tests

```bash
npm test
```

---

### ▶️ Run the App

```bash
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`).

---

### 🎨 Format Code

```bash
npx prettier . --write
```

* Configuration is defined in `.prettierrc.json`
* You may customise formatting, but ensure it aligns with assignment guidelines

#### 💡 VS Code Users

* Install Prettier extension
* Auto-format on save is enabled by default
* To disable:

  * Edit `.vscode/settings.json`
  * Set:

    ```
    "editor.formatOnSave": false
    ```

---

## 📂 Project Structure

```bash
src/
  main.ts        # Entry point & core game logic
  types.ts       # Shared types
  util.ts        # Utility functions
  state.ts       # State transformations
  view.ts        # Rendering logic
  observable.ts  # Observable stream creation

index.html       # Game container (avoid modifying IDs)
src/style.css    # Styling
test/*.test.ts   # Unit tests (Vitest)
```

---

## 🧩 Implementation Notes

* Most game logic resides in `src/main.ts`
* You may split logic into multiple modules using TypeScript modules
* Avoid over-fragmentation of files to maintain readability

### 🔧 Editable Files

* `src/main.ts` → Core game logic
* `src/style.css` → Styling
* `index.html` → UI structure (avoid changing existing IDs)
* `test/` → Unit tests

---

## 🧪 Testing

* Uses **Vitest**
* Tests located in `test/*.test.ts`
* Designed to validate core game logic and behaviour

---

## 🎓 Academic Context

Originally developed as part of a Functional Reactive Programming project 

Focus areas include:

* RxJS Observables
* Functional programming
* Reactive state management

---

## 🚀 Future Improvements

* Song selection system
* Pause / resume functionality
* Difficulty scaling
* Visual polish & animations

---

## 👤 Author

**Ganpatth**

---
