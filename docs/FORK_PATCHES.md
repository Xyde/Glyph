# Glyph Fork Patches & Customizations

This document catalogs all intentional divergences between this fork (`Xyde/Glyph`) and upstream (`SidhuK/Glyph`).
Use this manifest during upstream rebases to rapidly audit, re-apply, or retire custom patches.

---

## Patch 1: Remote Cloud-Only Compilation Pipeline
- **Problem**: Apple Silicon M-series Macs feature soldered NAND flash storage where firmware and Secure Enclave data reside. Heavy local Rust/Node compilation cycles impose high write-amplification wear on internal drives.
- **Resolution**: Implemented a headless GitHub Actions build pipeline that dispatches clean release builds onto cloud macOS runners, packaging and returning the final notarized `.dmg` / `.tar.gz` artifact.
- **Files Added**:
  - `.github/workflows/build-community.yml`: Workflow defining cloud runner compilation and artifact packaging.
  - `scripts/cloud_build.nu`: Nushell orchestration script for triggering runs and streaming cloud build logs headlessly.
- **Upstream Conflict Risk**: Zero (isolated files).

---

## Patch 2: Strip Commercial Upsell & Community Nag Banners
- **Problem**: Community builds contain persistent upgrade and license purchasing cards in the sidebar and settings panels.
- **Resolution**: Removed the footer upsell components cleanly without altering application layout or settings functionality.
- **Files Modified / Removed**:
  - `src/components/licensing/LicenseStatusFooter.tsx`: Deleted.
  - `src/components/app/Sidebar.tsx`: Removed `<LicenseStatusFooter />` inclusion from `sidebarBottomLayer`.
  - `src/components/app/SidebarSettingsContent.tsx`: Stripped `settingsFeedbackCardCommunity` upsell card.
  - `src/components/licensing/LicenseSettingsCard.tsx`: Removed the "Official build" purchase banner row while keeping benign license status information intact.
- **Upstream Conflict Risk**: Low.

---

## Patch 3: Folio Virtualization Font-Scale Alignment
- **Problem**: TanStack Virtual in `FolioNotesListPane` utilized a hardcoded pixel estimate (`FOLIO_NOTE_ROW_ESTIMATE = 100`) and static pixel `min-height: 100px`. When UI font size was scaled up (e.g. font 26 / 29.7px root font), items expanded to ~170px–180px in height while offsets remained spaced at 100px, causing severe vertical collisions where note rows overlapped each other.
- **Resolution**:
  - Created `src/hooks/useUiFontSize.ts` to subscribe reactively to `settings:updated` events and `ui.fontSize` settings.
  - Scaled `estimateSize` dynamically in `FolioNotesListPane.tsx` using `FOLIO_NOTE_ROW_ESTIMATE * (uiFontSize / 14)`.
  - Keyed the virtual list by `uiFontSize` so font changes immediately reset measurement caches.
  - Converted `min-height: 100px` to `6.25rem` in `49-folio-mode.css` so minimum bounds scale with root typography.
  - Replaced hardcoded `line-height: 16px` on note dates/folders with `line-height: 1.35` and removed `overflow: hidden` on `.folioNoteMeta`, preventing descenders (such as lowercase 'p') from being clipped into a small 'D'.
  - Added `flex-wrap: wrap` to `.folioNoteMeta` so folder names automatically drop to the next line when width is constrained or the folder name is long.
- **Files Added / Modified**:
  - `src/hooks/useUiFontSize.ts`: Reactive query hook for UI font size.
  - `src/components/folio/FolioNotesListPane.tsx`: Dynamic row sizing and cache invalidation.
  - `src/styles/app/49-folio-mode.css`: Converted row pixel min-heights to rem units, fixed line-height descender clipping, and enabled flex-wrapping.
- **Upstream Conflict Risk**: Medium (core folio layout).

---

## Patch 4: Info Sidebar Responsive Font Scaling
- **Problem**: The right-hand notes Info/Properties pane had hardcoded pixel bounds (`min: 260px`, `default: 340px`). At font 26, the 3-column sub-tabs (`Stats`, `Contents`, `Backlinks`) were starved for horizontal space and truncated to single-character ellipses (`...S...`, `...C...`, `...B...`), while 4-digit numbers in the 2-column stat card grid (`1,163 Words`, `7,895 Characters`) truncated to `1,1...` and `7,8...`.
- **Resolution**:
  - Scaled sidebar `min` bound, `max` bound, and default width proportionally with `uiFontSize` in `MainContent.tsx`.
  - Converted `.markdownEditorInfoSubTab` height from static `26px` to `min-height: 1.625rem; height: auto;`.
  - Switched `.markdownEditorInfoStatGrid` to `repeat(auto-fit, minmax(110px, 1fr))`.
  - Clamped `.markdownEditorInfoStatCard strong` font size with `clamp(1.1rem, calc(var(--text-base) * 1.15), 1.6rem)` so numbers scale legibly without overflowing card bounds.
- **Files Modified**:
  - `src/components/app/MainContent.tsx`: Dynamic info sidebar width bounds.
  - `src/styles/app/30-markdown-editor-pane.css`: Responsive sub-tab heights and stat grid clamping.
- **Upstream Conflict Risk**: Low to Medium.

---

## Patch 5: Responsive Form Controls & Headers for Extreme Typography Scaling (Font 33)
- **Problem**: When UI font scale is bumped to extreme levels (e.g. `ui.fontSize: 33` / 2.35x scale), controls with hardcoded pixel heights and horizontal paddings break:
  - `.settingsSelectNative` was locked to `height: 32px; min-height: 34px;`, slicing off the lower half of dropdown text (`Geist`, `JetBrains Mono`).
  - `.settingsSidebarSearchInput` had fixed `padding-left: 30px;` while the magnifying glass icon expanded to ~28px at `left: 16px`, causing placeholder text (`Search settings`) to render directly on top of the icon.
  - Number input stepper (`FontSizeControl`) had `w-16` (64px), cramping 2-digit numbers against macOS stepper arrows.
  - `.folioNotesSearch` and `.folioNotesSort` had fixed `height: 28px;` and `width: 30px;`, compressing the search bar and sort button into tiny squished rectangles.
- **Resolution**:
  - Converted `.settingsSelectNative` to `height: auto; min-height: 2.25rem; line-height: 1.35; padding: 6px 36px 6px 12px;`.
  - Replaced fixed search padding with dynamic `padding: 4px 12px 4px calc(var(--icon-md) + 16px); min-height: 2.25rem; line-height: 1.35;`.
  - Expanded number input to `min-w-[5.5rem] w-auto min-h-[2.25rem]`.
  - Converted Folio search and sort buttons to dynamic `min-height: 2.25rem; height: auto; line-height: 1.35;` with scaled square bounds.
- **Files Modified**:
  - `src/styles/app/10-settings-controls.css`
  - `src/styles/app/09-settings-shell.css`
  - `src/components/settings/InterfaceTypographySection.tsx`
  - `src/styles/app/49-folio-mode.css`
- **Upstream Conflict Risk**: Low.

---

## Patch 6: Viewport-Relative Editor Text Centering & Responsive Content Max-Width
- **Problem**:
  - In 3-column Folio mode, the editor pane occupies the right ~65% of the screen. Standard `margin: 0 auto` centers the note text relative to the editor pane rather than the physical display, pushing the text zone into the far right third of the monitor (~65% midpoint).
  - `--readable-content-max-width` was hardcoded to `720px`. At large font sizes (e.g. font 33), 720px fits only ~22 characters total, severely squashing multi-column tables and forcing words to wrap every 4 letters.
- **Resolution**:
  - Exposed `--editor-left-offset` dynamically from `MainContent.tsx` and `FolioWorkspace.tsx` representing `(sidebarCollapsed ? 0 : sidebarWidth) + (folioMode ? folioNotesWidth : 0)`.
  - Replaced editor pane auto-margins with a viewport-relative centering formula:
    `margin-left: max(var(--editor-readable-content-gutter), calc(50vw - var(--editor-left-offset) - (var(--editor-readable-content-max-width) / 2))); margin-right: auto;`
    When space allows, the text zone centers mathematically on the physical monitor midpoint (`50vw`), aligning with forward vision. When space is constrained, it smoothly clamps to the minimum gutter.
  - Converted `--readable-content-max-width` in `semantic-base.css` to `clamp(720px, 45rem, min(calc(100% - 48px), 1100px))` so text and table columns scale with typography instead of suffocating at 22 characters.
- **Files Modified**:
  - `src/components/app/MainContent.tsx`
  - `src/components/folio/FolioWorkspace.tsx`
  - `src/styles/app/30-markdown-editor-pane.css`
  - `src/styles/themes/semantic-base.css`
- **Upstream Conflict Risk**: Low to Medium.

---

## Patch 7: Viewport Ratio Engine (1/3, 1/2, 2/3, 3/4) & Toolbar Switcher
- **Problem**: Users wanting an anchored canvas (Antigravity 2.0 style) had no direct mechanism to set exact viewport column ratios (1/3, 1/2, 2/3, 3/4) or cycle between them directly from the editor toolbar.
- **Resolution**:
  - Expanded `EditorWidthMode` in `model.ts` and `definitions.ts` to include `"ratio-1-3"`, `"ratio-1-2"`, `"ratio-2-3"`, and `"ratio-3-4"`.
  - Added mathematical ratio calculations to `applyEditorWidthMode` in `appearance.ts` (`min(33.33vw, ...)`, `min(50vw, ...)`, `min(66.67vw, ...)`, `min(75vw, ...)`).
  - Created reactive TanStack query hook `useEditorWidthMode.ts` (zero `useEffect`).
  - Created `EditorWidthSwitcher.tsx` toolbar button displaying active ratio (`1/3`, `1/2`, `2/3`, `3/4`) and cycling on click.
  - Added smooth outward bloom transitions (`transition: max-width 180ms ease, margin-left 180ms ease`) in `30-markdown-editor-pane.css`.
- **Files Added / Modified**:
  - `src/hooks/useEditorWidthMode.ts`: Reactive query hook for editor width mode.
  - `src/components/editor/EditorWidthSwitcher.tsx`: Toolbar ratio cycling button.
  - `src/components/preview/MarkdownEditorPane.tsx`: Embedded switcher in header toolbar.
  - `src/lib/settings/model.ts`: Extended `EditorWidthMode` union.
  - `src/lib/settings/definitions.ts`: Updated `isEditorWidthMode` guard.
  - `src/lib/appearance.ts`: Implemented ratio bounds.
  - `src/main.tsx`: Handled ratio settings updates.
  - `src/components/settings/EditorSettingsPane.tsx`: Added ratio options to dropdown.
  - `src/i18n/locales/en/settings.general.json`: Added ratio translations.
  - `src/styles/app/30-markdown-editor-pane.css`: Added button styles and bloom transitions.
---

## Patch 8: Files Header Toolbar & Sidebar Tabs Typography Scaling Fix
- **Problem**:
  - At large custom UI font sizes (e.g. font 33), `--icon-sm` scales up to 34px and `--icon-md` to 38px.
  - The Files section header actions (`.sidebarStackHeaderAction`, `.sidebarStackHeaderSortNative`) had hardcoded `width: 22px; height: 22px;` with `left: 4px` absolute positioning. The 34px sort icon overflowed its container by 12px, rendering directly on top of the adjacent expand icon and making the toolbar an overlapping mess.
  - The sidebar view tab buttons (`button.sidebarViewTab`) had hardcoded `height: 26px;`, vertically clipping 38px icons and causing folder tabs to squish horizontally.
- **Resolution**:
  - Replaced hardcoded 22px bounding boxes with responsive minimums: `min-width: max(22px, calc(var(--icon-sm) + 6px)); min-height: max(22px, calc(var(--icon-sm) + 6px)); width: auto; height: auto;`.
  - Replaced hardcoded `left: 4px` sort icon placement with true box-centering: `top: 50%; left: 50%; transform: translate(-50%, -50%);` and full-inset select overlay (`position: absolute; inset: 0;`).
  - Increased action gap to `6px` and scaled tab button min-height to `max(26px, calc(var(--icon-md) + 6px))`.
  - Added explicit `line-height: 1;` to `.markdownEditorWidthBtn` to prevent vertical text collapse.
- **Files Modified**:
  - `src/styles/app/04-sidebar.css`
  - `src/styles/app/30-markdown-editor-pane.css`
  - `docs/FORK_PATCHES.md`
---

## Patch 9: Sidebar & Settings Navigation User-Select & Label Truncation Fix
- **Problem**:
  - Accidentally dragging or holding down the mouse button in the sidebar or settings navigation highlighted UI headings (`APPLICATION`, `WORKSPACE`, `LABS`, `Search :`) with native WebKit text selection blocks.
  - In settings navigation, `.settingsTabLabel` lacked clean ellipsis truncation, causing labels at high UI font sizes to clip raggedly against the sidebar boundary.
- **Resolution**:
  - Added `user-select: none; -webkit-user-select: none;` to `.sidebar`, `.settingsSidebarTabs`, `.settingsSidebarTabGroupHeading`, and `.settingsSidebarSearch` (while preserving `user-select: text` on `.settingsSidebarSearchInput`).
  - Added `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` to `.settingsTabLabel`.
- **Files Modified**:
  - `src/styles/app/04-sidebar.css`
  - `src/styles/app/09-settings-shell.css`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.

---

## Patch 10: Tasks Pane Typography Scaling & Chevron Collision Fix
- **Problem**:
  - In Tasks toolbar, `.tasksScopeSelect` ("All notes") and `.tasksSearch` had hardcoded `height: 28px;`. At large UI font sizes (e.g. font 33), "All notes" text was sliced horizontally in half.
  - `--tasks-chevron-gutter` was hardcoded to `26px`. The negative margin calculation `margin-inline-end: calc(var(--tasks-chevron-gutter) - var(--icon-xl) - var(--space-2))` evaluated to $-33\text{px}$ when `--icon-xl` expanded to 50px, pulling note titles (e.g. `sadf`) backward directly underneath the collapse chevron (`>sadf`).
- **Resolution**:
  - Scaled `--tasks-chevron-gutter` to `max(26px, calc(var(--icon-xl) + var(--space-2)))`, ensuring `margin-inline-end` evaluates to $\ge 0\text{px}$ and pane padding automatically expands.
  - Replaced fixed 28px heights on `.tasksScopeSelect` and `.tasksSearch` with `min-height: 2.25rem; height: auto; line-height: 1.35;` and centered background arrows (`calc(100% - 14px) center`).
  - Scaled `.tasksToolbarEnd button` bounding boxes dynamically with `--icon-sm`.
- **Files Modified**:
  - `src/styles/app/15-tasks.css`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.

---

## Patch 11: Empty State Shortcut Badge Typography Scaling Fix
- **Problem**:
  - In empty workspace states ("Press ⌘+K to get started"), `.mainEmptyShortcutBadge` had hardcoded `height: 20px; padding: 0 6px;`.
  - At custom UI font size 33, the shortcut text was $30.4\text{px}$ tall, severely choking the badge and leaving zero breathing room around `⌘+K`.
- **Resolution**:
  - Scaled `.mainEmptyShortcutBadge` dynamically with `1em`: `min-height: max(20px, calc(1em + 6px)); height: auto; padding: 2px 8px; line-height: 1.2; gap: 4px;`.
- **Files Modified**:
  - `src/styles/app/20-main-empty-state.css`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.
