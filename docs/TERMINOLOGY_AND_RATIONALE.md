# Fork Manifesto: Terminology, Rationale & Design Decisions

This document catalogs the philosophical foundations, terminology mappings, and design rationale behind the `Xyde/Glyph` fork of Glyph.

While [`docs/FORK_PATCHES.md`](file:///Users/test/glyph-offline-build/docs/FORK_PATCHES.md) tracks low-level mechanical git diffs for rebase hygiene, this document serves as the **human architectural guide and Rosetta Stone** for anyone reading, adopting, or contributing to this fork.

---

## 1. Fork Philosophy & Core Tenets

Glyph is a fast, local-first macOS Personal Knowledge Management (PKM) application. However, upstream suffered from conceptual drift, semantic collisions, and accidental feature accretion. Our fork is guided by four non-negotiable design principles:

### A. Anti-Jargon & Monosemantic Naming
Every UI label, tab, button, and command must describe its physical function in plain English. We reject clever, slippery buzzwords that try to sound profound but create cognitive ambiguity. If a settings panel designates the destination folders for automated features, we do not call it "Space"; we call it **"Feature Folder Destinations"**.

### B. Buffer Truth Over Fake Chrome (Markdown Fidelity)
A markdown note is a plain text file on the local filesystem. The editor canvas must respect the literal byte-level truth of that file. We do not inject artificial headings that pretend to be in-file text, nor do we silently mutate buffers behind the author's back. 

### C. Clean Flow Over IDE Clutter (The Anti-Obsidian Stutter)
Power-user tools frequently suffer from feature accretion: stacking browser tabs, pane headers, file trees, and in-canvas headers until the same file title is echoed four times within 150 vertical pixels. We prioritize serene, clean writing surfaces where navigation stays in the navigation layer and the document owns the canvas.

### D. Native macOS Polish
macOS users expect keyboard predictability (`⌘+`/`⌘-` zoom, native menus), correct menu placement (right-anchored rail popups), crisp typography scaling, and zero webview event leaks. Every mutation must feel native to Darwin.

---

## 2. The Rosetta Stone: Terminology Translation Table

To prevent disorientation when comparing upstream code, issues, or PRs with our fork, use this authoritative mapping:

| Upstream Concept / Label | Our Fork Label | Code / Schema Reference | The Friction & Rationale |
| :--- | :--- | :--- | :--- |
| **Space** | **Vault** | `space_state`, SQLite tables | "Space" collided with macOS Mission Control Spaces, window spaces, and generic disk storage. "Vault" is concrete, self-contained, established in the PKM ecosystem, and directly conveys a folder of plain-text markdown files on disk. |
| **Space Settings** (under `WORKSPACE`) | **Feature Folder Destinations** | `SpaceSettingsPane.tsx`, `settings.search.json` | Upstream's label implied configuring the entire workspace/vault. In physical reality, the panel only configures four automated subfolder paths (Inbox, Daily Notes, Templates, Attachments). The new name is 100% monosemantic. |
| **New Space / Open Space** | **New Vault / Open Vault** | Native macOS menu, `src-tauri/src/lib.rs` | Aligns system menu bar items (`Vault → Open Vault…`) with the user's mental model. |
| **Folio** | **Folio (Note Stream)** | `FolioNotesListPane.tsx`, `49-folio-mode.css` | A two-pane master-detail view combining a high-density, card-based note stream on the left with a dedicated reading/writing canvas on the right. |
| **Raw Mode (`<>`)** | **Source / Raw Mode** | `RawMarkdownEditor.tsx`, CodeMirror 6 | Unrendered 1:1 character-level markdown editing buffer. |
| **Rich Mode (`✏️`)** | **Rich / WYSIWYG Mode** | `NoteEditorSurface.tsx`, TipTap / ProseMirror | Live rendered markdown document editing. |

> [!IMPORTANT]
> **Architectural Guardrail: Schema Preservation vs. Presentation Decoupling**
> In the frontend UI, command palette, search index, and macOS menus, all references to "Space" have been decoupled to **"Vault"** or **"Feature Folder Destinations"**.
> 
> However, internal Rust SQLite structs (`space_state`, database migrations, IPC command names) **deliberately retain the `space` identifier**. This prevents breaking existing users' database schemas on disk and maintains compatibility with upstream database migration history. Never execute a blind global regex rename across native database modules.

---

## 3. Case Studies: Why We Diverged

### Case Study 1: The "Space Settings" Cognitive Collision
* **The Structural Friction**: Users opening Settings encountered a sidebar tab called "Space" under the "WORKSPACE" header. Inside, they found folder pickers for Inbox, Daily Notes, Templates, and Attachments. Users were left wondering: *"Am I supposed to pick a workspace here? Or am I choosing where notes go? Why is it called Space?"*
* **The Resolution**: Renamed the tab and panel header to **"Feature Folder Destinations"**, added an explicit subtitle (*"Designate destination folders inside this vault for Inbox, Daily Notes, Templates, and Attachments"*), and updated macOS menus to `Vault → Feature Folder Destinations…`. The friction evaporated immediately.

### Case Study 2: The Settings Crash & Native Gutter Anchoring
* **The Structural Friction**: Clicking the Settings gear icon in the lower navigation gutter crashed the entire frontend view. Furthermore, right-clicking or triggering native gutter menus caused popup menus to render disconnected across the screen.
* **The Causal Mechanics**:
  1. The gutter `onClick` handler passed the raw React synthetic `MouseEvent` directly into `openSettings(event as any)`. The UI state machine expected a tab identifier string (`"general"`, `"appearance"`), received an object, and crashed when trying to access string properties.
  2. Native context menus created via Tauri Webview lacked explicit placement constraints, defaulting to mouse coordinates rather than anchoring to the gutter rail edge.
* **The Resolution**:
  - Sanitized the click handler in [`src/components/app/SidebarGutter.tsx`](file:///Users/test/glyph-offline-build/src/components/app/SidebarGutter.tsx) to `onClick={() => openSettings()}`.
  - Hardened [`src/contexts/UIContext.tsx`](file:///Users/test/glyph-offline-build/src/contexts/UIContext.tsx) to reject non-string actions defensively.
  - Added `placement: "right-end"` in [`src/lib/nativeContextMenu.ts`](file:///Users/test/glyph-offline-build/src/lib/nativeContextMenu.ts) to snap popup menus directly to the rail boundary.

### Case Study 3: The Edit Mode "Void Effect" & Markdown Fidelity
* **The Structural Friction**: Opening notes in Raw Mode (`<>`) produced an unsettling "pitch-black void" between the top toolbar and the first line of content. 
* **The Investigation**:
  1. Inspection revealed that files with accidental leading newlines (`\n\n\n\n## Title`) had no visual ceiling. CodeMirror lacked a line numbers gutter, and the background was transparent against window chrome.
  2. Furthermore, in [`src/styles/app/30-markdown-editor-pane.css`](file:///Users/test/glyph-offline-build/src/styles/app/30-markdown-editor-pane.css), `.rfNodeNoteEditorBody` had a hardcoded `padding-top: 9vh`, pushing even clean files 100+ pixels down into empty black space.
* **The Architectural Rule**: Never attempt to "fix" the void by injecting an artificial `# Title` heading into the canvas. Synthetic titles break markdown buffer purity, fail when leading newlines exist, and create uncanny "brick wall" backspace bugs. The fix is spatial: remove artificial `9vh` padding, and provide clear margin/ceiling hierarchy.

### Case Study 4: The Toolbar Duplicate Title Stutter
* **The Structural Friction**: Opening two notes spawned a tab strip while simultaneously leaving `<ActiveFileTitle />` visible, producing duplicate titles 15 pixels apart: `[← →] !index [!Land...] [!index] [+]`.
* **The Resolution**: Toolbar elements must be mutually exclusive. If multiple tabs are active, the active tab pill provides the title; the static breadcrumb label must yield.

---

## 4. Contributor Guide for This Fork

1. **Prioritize Hard Subtraction**: Before adding new settings, abstractions, or wrapper `div`s, ask whether existing code can be narrowed or deleted.
2. **Respect the 80/20 Rule**: Never rewrite a working 80% subsystem to fix a 20% visual bug. Make minimal, surgical edits.
3. **Keep Terminology Monosemantic**: When introducing new user-facing features or settings, avoid vague umbrella terms. Name things by what they physically do.
