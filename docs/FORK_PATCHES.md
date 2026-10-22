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

---

## Patch 12: Connections Graph Toolbar Icon Collision Fix
- **Problem**:
  - In Connections graph view, `.spaceConnectionsToolbar button` had hardcoded `width: 28px; height: 28px;` with `gap: 2px`.
  - At custom UI font size 33, `--icon-md` scales to 38px, causing the search button (`Search01Icon`) and the filter slider button (`SlidersVerticalIcon`) to overflow their 28px containers and overlap directly into a single tangled glyph on the right screen edge.
- **Resolution**:
  - Scaled button boxes dynamically: `min-width: max(28px, calc(var(--icon-md) + 6px)); height: max(28px, calc(var(--icon-md) + 6px)); min-height: max(28px, calc(var(--icon-md) + 6px)); width: auto;`.
  - Increased toolbar gap to `6px` and ensured `flex: 0 0 auto` on child SVGs.
  - Dynamically scaled `.localNoteConnectionsClose` button box.
- **Files Modified**:
  - `src/styles/app/45-local-connections.css`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.

---

## Patch 13: All Notes Activity Heatmap Layout & Collision Fix
- **Problem**:
  - In All Notes view (`ActivityHeatmapGrid`), `.activityHeatmapWeekday` and `.activityHeatmapMonth` used unconstrained `font-size: calc(var(--text-base) * 0.7);` which expanded to $23.1\text{px}$ at custom UI font size 33.
  - The $23.1\text{px}$ weekday font exceeded the $15\text{px}$ cell line-height, stretching only the labeled rows (Mon, Wed, Fri) and distorting the grid matrix into irregular, unevenly spaced cells with vertical gaps.
  - The enlarged weekday labels expanded to $55\text{px}$ width (exceeding the hardcoded $32\text{px}$ scroller reservation), causing the grid to overflow horizontally. In `.activityHeatmapScroller` (`flex-direction: row-reverse`), the default right-anchored scroll position clipped the leftmost $28\text{px}$ offscreen, truncating "Mon" to "on" and "Wed" to "ed".
  - Week 0 mid-month start logic (`cells.length === 0 && cursor.getDate() <= 14`) placed a month label ("Oct") only 2 weeks away from the 1st of the next month ("Nov"), causing month labels to collide horizontally as a composite string (`OctNov`).
- **Resolution**:
  - Clamped `.activityHeatmapMonth` and `.activityHeatmapWeekday` font sizes to `clamp(9px, calc(var(--text-base) * 0.65), 11px)` so labels scale cleanly without exceeding the $15\text{px}$ cell pitch or the $36\text{px}$ weekday column width budget.
  - Locked grid row heights uniformly with `grid-template-rows: auto repeat(7, var(--activity-heatmap-cell));` in `15-activity-timeline.css` to guarantee all 7 weekday rows maintain identical square proportions.
  - Scaled `.activityHeatmapScroller` cell calculation to `calc((100cqi - 36px) / 53 - var(--activity-heatmap-gap))` with safe $36\text{px}$ column allocation.
  - Clamped `.activityHeatmapLegend` font size to `clamp(9px, calc(var(--text-base) * 0.65), 12px)`.
  - In `heatmapModel.ts`, restricted week 0 month labeling to `cursor.getDate() <= 4` and added a safeguard pass dropping any month start within 3 weeks of the preceding label, mathematically preventing adjacent month collisions.
- **Files Modified**:
  - `src/styles/app/15-activity-timeline.css`
  - `src/components/app/activity/heatmapModel.ts`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.

---

## Patch 14: Collections & Databases Toolbar Typography & Layout Scaling Fix
- **Problem**:
  - In Collections view (`CollectionTopBar`), `.databasesCollectionBreadcrumbLabel` had hardcoded `max-width: 140px;`. At large custom UI font sizes (e.g. font 33), 140px fit only ~7 characters, truncating folder paths prematurely into `Game n...` despite hundreds of pixels of empty header space.
  - Action buttons (`.databasePinButton`, `.databaseCollectionActionsButton`, `.databasesViewTabMenu`) had fixed $30\text{px}$ bounding boxes with $38\text{px}$ `--icon-md` icons, causing icons to overflow and clip.
  - In the secondary view bar (`DatabasesPane`, `DatabaseToolbar`), `--database-control-height: 30px;` was hardcoded.
  - At font size 33, `var(--text-xs)` expands to $29.7\text{px}$. Inside fixed $30\text{px}$ controls with $4\text{px}$ padding and borders, the content area choked to $24\text{px}$, slicing text baselines off in `.databaseToolbarGroupBySelect` (`Tags (multi-lane)`).
  - The search input (`.databaseToolbarSearch`) had fixed `width: min(200px, 24vw); min-width: 132px;`, severely truncating the "Search Collection..." placeholder to `Search C` with zero typing room.
  - `button.databasesViewTab` and `button.databaseToolbarChip.databasesNewNoteButton` had fixed $30\text{px}$ heights, vertically choking $27.7\text{px}$ tab text and $31.3\text{px}$ `+ New Note` text.
- **Resolution**:
  - Scaled `--database-control-height` dynamically: `max(30px, calc(var(--text-xs) * 1.35 + 8px))`, scaling controls cleanly to $\sim 46\text{px}$ at font size 33 while preserving $30\text{px}$ for standard fonts.
  - Scaled `.databaseToolbarSearch` dynamically: `width: min(max(200px, calc(var(--text-xs) * 12)), 32vw); min-width: max(132px, calc(var(--text-xs) * 7));`, allowing full placeholder visibility.
  - Scaled `.databaseToolbarGroupBySelect` with dynamic right padding (`max(28px, calc(var(--icon-xs) + 16px))`) and line-height `1.25`, eliminating baseline clipping and chevron collisions.
  - Scaled `button.databasesViewTab`, `.databasesViewTabMenu`, and `.databasesNewNoteButton` heights and padding dynamically with font and icon tokens.
  - Scaled `.databasesCollectionBreadcrumbLabel` max-width to `min(32vw, 320px)` and `.mainTabsBreadcrumbButton` to `min(36vw, 320px)`.
- **Files Modified**:
  - `src/styles/app/37-database.css`
  - `src/styles/app/37-database-views.css`
  - `src/styles/app/37-database-collections.css`
  - `src/styles/app/17-main-tabs.css`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.

---

## Patch 15: AI Mode Composer Typography & Button Scaling Fix
- **Problem**:
  - In AI mode (`AIComposer`), the send button (`button.aiComposerSend`) had fixed `height: 28px; width: 28px;` in CSS while inheriting Tailwind's `size-8` (`2rem` = $75.4\text{px}$ at root rem scale $37.7\text{px}$). This caused the send button to distort into a horizontally stretched, vertically squashed oval pancake (`( ↑ )`).
  - The arrow icon inside (`ArrowUp02Icon`, `--icon-md` = $38\text{px}$) severely overflowed the $28\text{px}$ container height, clipping its top and bottom.
  - In `ModelSelector.module.css`, `.trigger` had hardcoded `height: 30px;` while `.triggerLogo` used `--icon-lg` ($46.2\text{px}$) and `.providerSvg` used `--icon-xl` ($49.5\text{px}$), causing the provider spark to overflow the dropdown pill.
  - `.aiComposerMentionButton` had fixed $26\text{px}$ dimensions against a $30\text{px}$ `AtIcon`.
  - `.aiComposerInput` had fixed bottom padding of $44\text{px}$, allowing typed text to scroll behind the expanding bottom controls.
- **Resolution**:
  - Locked `button.aiComposerSend` and `.aiComposerStop` to a strict 1:1 circular ratio: `min-width: max(28px, calc(var(--icon-md) + 6px)); min-height: max(28px, calc(var(--icon-md) + 6px)); width: max(28px, calc(var(--icon-md) + 6px)); height: max(28px, calc(var(--icon-md) + 6px)); aspect-ratio: 1 / 1; border-radius: 9999px;`, guaranteeing a perfectly centered circular button framing the arrow icon.
  - Scaled `.aiComposerMentionButton` dynamically: `min-width: max(26px, calc(var(--icon-sm) + 6px)); min-height: max(26px, calc(var(--icon-sm) + 6px)); width: auto; height: auto;`.
  - Scaled `ModelSelector.module.css` `.trigger` min-height dynamically, balanced `.triggerLogo` and `.providerSvg` to `--icon-md`, and set `object-fit: contain`.
  - Scaled `.aiComposerInput` bottom padding to `max(44px, calc(var(--icon-md) + 18px))` and min-height to `max(88px, calc(var(--text-sm) * 2 + var(--icon-md) + 24px))`.
- **Files Modified**:
  - `src/styles/app/21-ai-composer-context.css`
  - `src/components/ai/ModelSelector.module.css`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.

---

## Patch 16: Settings Layout Width Expansion & Model Combobox Overlap Fix
- **Problem**:
  - Settings panels (`.settingsPanelHeader`, `.settingsSectionHeader`, `.settingsCard`, and `.shortcutsToolbar`) had a hardcoded `width: 70%; max-width: 644px; margin: 0 auto;`. On widescreen displays, this left $> 50\%$ of the screen width as empty black negative space while cramping settings controls.
  - Inside settings cards, the left copy description (`.settingsFieldCopy`) was squeezed into $\sim 200\text{px}$, causing explanatory sentences to break into 7-8 awkward vertical lines.
  - Form controls on the right (`.settingsFieldControl` and `.settingsSelectWrap`) were constrained to `max-width: 360px;`, causing dropdown labels like "Same as chat model" to truncate with ellipses (`Same as chat m...`).
  - In `33-model-combobox.css`, `.modelCombobox` had hardcoded `max-width: 280px;`, `.settingsSelectNative` had fixed `padding-right: 92px;`, and `.modelComboboxBadge` was positioned at `right: 34px;` with unconstrained font scaling. At large custom UI font sizes (e.g. font 33 / $26.4\text{px}$ text), 92px fits only $\sim 3.5$ characters. The "Default" option text ($\sim 120\text{px}$), the "models" badge ($\sim 110\text{px}$), and the chevron collided directly, creating an overlapping text bug (`Defaultmodels v`).
- **Resolution**:
  - Expanded `.settingsPanelHeader`, `.settingsSectionHeader`, `.settingsCard`, and `.shortcutsToolbar` from fixed 70% / $644\text{px}$ to `width: 100%; max-width: min(880px, 92vw); margin: 0 auto;`, efficiently utilizing available screen space while preserving clean readable margins.
  - Expanded `.settingsFieldControl` and `.settingsSelectWrap` max-width to `min(480px, 55%)` and `min(480px, 100%)`, providing generous breathing room for dropdown labels.
  - Converted `.modelCombobox` to `max-width: 100%;` and ensured `.modelComboboxInputWrap` spans full width (`width: 100%`).
  - Scaled `.settingsSelectNative` right padding dynamically: `max(96px, calc(var(--text-base) * 0.75 * 7 + 42px))`, guaranteeing sufficient clearance for the badge and chevron at any font size.
  - Clamped `.modelComboboxBadge` font size to `clamp(10px, calc(var(--text-base) * 0.72), 14px)` and positioned it at `right: calc(var(--icon-md) + 12px);`, eliminating text collision and badge clipping.
- **Files Modified**:
  - `src/styles/app/09-settings-shell.css`
  - `src/styles/app/10-settings-controls.css`
  - `src/styles/app/11-settings-misc.css`
  - `src/styles/app/33-model-combobox.css`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.

---

## Patch 17: Dynamic Navigation Sidebar Width & Proportional Bounds Scaling
- **Problem**:
  - Upstream Glyph hardcoded the main navigation sidebar width to a static pixel integer (`sidebarWidth: 260` in `UIContext.tsx`), bounded by `const SIDEBAR_MIN_WIDTH = 220` in `AppShell.tsx`, with CSS fallback `--sidebar-width: 260px` in `semantic-base.css` and `min-width: 220px` in `04-sidebar.css`.
  - While custom UI font scaling (`ui.fontSize: 33`) expanded typography and icons by $2.357\times$, the sidebar container remained trapped at $260\text{px}$.
  - At font 33 ($26.4\text{px}$ text with $38\text{px}$ icons), a $260\text{px}$ container accommodates only 6–8 characters before overflowing. Every primary navigation button (`New Note`, `All Notes 743`, `Collections`, `Connections`) and file tree folder path (`178...`, `19th...`) was abruptly amputated with ellipses (`...`).
  - `.sidebarQuickActionBtn` had fixed `min-height: 26px; padding: 2px 8px;`, `.sidebarTopNavigation` had fixed `gap: 2px;`, and `New Note` used `--icon-lg` ($46.2\text{px}$) while all other items used `--icon-md` ($38\text{px}$), creating unbalanced visual weight.
- **Resolution**:
  - In `UIContext.tsx`, dynamically scaled `effectiveSidebarWidth`: when at the default $260\text{px}$ state, it automatically derives `Math.round(260 * Math.max(1, fontScale * 0.72))` ($\approx 441\text{px}$ at font 33), with a dynamic minimum floor `Math.round(220 * Math.min(1.8, Math.max(1, fontScale * 0.72)))` ($\approx 373\text{px}$ at font 33).
  - In `AppShell.tsx`, dynamically scaled `min` and `max` drag bounds for `useResizablePanel` based on `fontScale`, allowing flexible user adjustment while preventing claustrophobic squashing.
  - In `semantic-base.css` and `04-sidebar.css`, scaled `--sidebar-width: clamp(260px, calc(var(--text-base) * 15.5), 520px);` and `.sidebar` `min-width: clamp(220px, calc(var(--text-base) * 12.5), 420px);`.
  - In `SidebarContent.tsx`, harmonized `New Note`'s icon to `var(--icon-md)` to match the rest of the navigation hierarchy.
  - In `04-sidebar.css` and `35-sidebar-nav.css`, scaled `gap`, `min-height`, and `padding` across action buttons and the search bar so all items maintain generous touch targets and comfortable breathing room matching modern macOS desktop conventions.
- **Files Modified**:
  - `src/contexts/UIContext.tsx`
  - `src/components/app/AppShell.tsx`
  - `src/components/app/SidebarContent.tsx`
  - `src/styles/themes/semantic-base.css`
  - `src/styles/app/04-sidebar.css`
  - `src/styles/app/35-sidebar-nav.css`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.

---

## Patch 18: Decoupled External Markdown Viewer Typography & Keyboard Zoom
- **Problem**:
  - Standalone markdown notes opened from Finder (where Glyph acts as the default system `.md` handler via `ExternalMarkdownWindow`) unconditionally inherited workspace editor typography (`ui.editorFontSize`, `ui.editorFontFamily`) and global UI scaling applied to `:root`.
  - When users set large typography for workspace editing (e.g. 40px), external notes opened with enormous text, making quick document viewing practically unreadable and distorting window chrome.
  - Furthermore, external note windows had no independent typography settings and lacked keyboard zoom controls (`⌘+` / `⌘-` / `⌘0`).
- **Resolution**:
  - Added independent settings `ui.externalFontFamily` (default `"Geist"`) and `ui.externalFontSize` (default `16`, clamped 10–36) in `src/lib/settings/model.ts`, `definitions.ts`, and `settings.ts`.
  - Created `<ExternalTypographySection />` in `src/components/settings/ExternalTypographySection.tsx` and mounted it inside `TypographySettingsPane.tsx`, allowing users to customize external note font family and font size independently.
  - Registered settings in search index and command palette (`settingsSearch.ts`, `settingsPaletteIcons.ts`, `settingsPaletteRegistry.ts`, i18n locales).
  - In `47-external-markdown.css`, scoped `--editor-font-size`, `--editor-inline-font-size`, `--editor-raw-font-size`, `--font-editor`, `--font-heading`, and heading scales to `--external-editor-font-size` and `--external-font-family`, completely isolating external windows from workspace `:root` cascades. Added static UI token resets (`--text-base: 14px`, etc.) to keep chrome crisp.
  - In `ExternalMarkdownWindow.tsx`, loaded external typography preferences, listened to `settings:updated`, and implemented on-the-fly `⌘+` / `⌘=` (zoom in), `⌘-` (zoom out), and `⌘0` (reset to configured size) keyboard shortcuts with capture handling.
- **Files Added / Modified**:
  - `src/lib/settings/model.ts`
  - `src/lib/settings/definitions.ts`
  - `src/lib/settings.ts`
  - `src/components/settings/ExternalTypographySection.tsx` (new)
  - `src/components/settings/TypographySettingsPane.tsx`
  - `src/components/settings/settingsSearch.ts`
  - `src/components/app/settingsPaletteIcons.ts`
  - `src/components/app/settingsPaletteRegistry.ts`
  - `src/i18n/locales/en/settings.typography.json`
  - `src/i18n/locales/en/settings.search.json`
  - `src/components/external-markdown/ExternalMarkdownWindow.tsx`
  - `src/styles/app/47-external-markdown.css`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.

---

## Patch 19: Full Window Native Webview Zoom & Dynamic Keyboard Shortcuts
- **Problem**:
  - Upstream Glyph provided no native window zoom or viewport magnification. Users seeking larger readable interfaces were forced to set `ui.fontSize` and `ui.editorFontSize` to extreme values (e.g. 40px), which artificially inflated font sizes while keeping layout containers, sidebars, and dialog widths static, resulting in clipped labels and cramped interfaces.
  - Furthermore, standard macOS zoom keyboard shortcuts (`⌘+` / `⌘-` / `⌘0`) were not bound in the workspace window, making dynamic reading adjustments frustrating.
- **Resolution**:
  - Enabled native WebKit webview magnification via Tauri's `@tauri-apps/api/webview` `getCurrentWebview().setZoom(factor)`.
  - Added `"core:webview:allow-set-webview-zoom"` to `src-tauri/capabilities/default.json` and enabled `"zoomHotkeysEnabled": true` in `src-tauri/tauri.conf.json`.
  - Created `src/lib/zoom.ts` containing zoom step calculations (`80%` to `200%`), discrete step progression (`80, 90, 100, 110, 125, 150, 175, 200`), state tracking, and synchronization helpers.
  - Added durable setting `ui.zoomLevel` (default `100`, range 80–200) across `model.ts`, `definitions.ts`, and `settings.ts`.
  - Integrated capture-phase keydown listeners in `src/main.tsx` for `⌘+`/`⌘=` (zoom in), `⌘-` (zoom out), and `⌘0` (reset to 100%), immediately updating the native webview scale and persisting to `settings.json`.
  - Added "Interface zoom" control in `AppearanceSettingsPane.tsx` with full search indexing and i18n support.
- **Files Added / Modified**:
  - `src-tauri/capabilities/default.json`
  - `src-tauri/tauri.conf.json`
  - `src/lib/zoom.ts` (new)
  - `src/lib/settings/model.ts`
  - `src/lib/settings/definitions.ts`
  - `src/lib/settings.ts`
  - `src/main.tsx`
  - `src/components/settings/AppearanceSettingsPane.tsx`
  - `src/components/settings/settingsSearch.ts`
  - `src/components/app/settingsPaletteIcons.ts`
  - `src/components/app/settingsPaletteRegistry.ts`
  - `src/i18n/locales/en/settings.appearance.json`
  - `src/i18n/locales/en/settings.search.json`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.

---

## Patch 20: Feature Folder Destinations Terminology Decoupling, Settings Crash Hardening & Native Gutter Anchoring
- **Problem**:
  - Upstream labeled the folder destination configuration tab as "Space" under the "WORKSPACE" category, causing acute cognitive confusion (users thought they were picking a workspace rather than setting automated destination folders for Inbox, Daily Notes, Templates, and Attachments).
  - Clicking the Settings gear in `SidebarGutter.tsx` passed a synthetic React `MouseEvent` into `openSettings()`, crashing the entire frontend because the settings reducer expected a string tab ID.
  - Native macOS context menus in the navigation gutter rendered detached across the screen rather than anchored to the rail.
  - Native macOS application menus used confusing "Space" terminology and filtered out the active vault from recent lists instead of marking it with a checkmark.
- **Resolution**:
  - Renamed the settings tab to **"Feature Folder Destinations"** across UI, commands, and search metadata (`settings.search.json`, `commands.json`, `shell.json`, `SpaceSettingsPane.tsx`).
  - Added an explicit subtitle explaining its exact purpose: *"Designate destination folders inside this vault for Inbox, Daily Notes, Templates, and Attachments."*
  - Aligned native macOS menus and command palette to "Vault" ("New Vault", "Open Vault", "Vaults >", "Close Vault", "Reveal Vault in Finder").
  - Fixed active space filtering in `src-tauri/src/lib.rs` and added `✓ ` active vault checkmarks.
  - Sanitized `openSettings()` in `SidebarGutter.tsx` and `UIContext.tsx`, and added a fallback in `SettingsTabContent.tsx`.
  - Added `placement: "right-end"` to gutter native context menus in `nativeContextMenu.ts`.
- **Files Added / Modified**:
  - `src/components/app/SidebarGutter.tsx`
  - `src/contexts/UIContext.tsx`
  - `src/components/settings/SettingsTabContent.tsx`
  - `src/components/settings/SpaceSettingsPane.tsx`
  - `src/lib/nativeContextMenu.ts`
  - `src-tauri/src/lib.rs`
  - `src/i18n/locales/en/commands.json`
  - `src/i18n/locales/en/shell.json`
  - `src/i18n/locales/en/settings.search.json`
  - `docs/FORK_PATCHES.md`
  - `docs/TERMINOLOGY_AND_RATIONALE.md` (new)
- **Upstream Conflict Risk**: Low.

---

## Patch 21: Toolbar Tab Stutter Elimination & Editor Void Removal
- **Problem**:
  - In `TabBar.tsx`, `<ActiveFileTitle />` was hardcoded to render unconditionally next to navigation arrows. When `tabs.length > 1`, Glyph rendered both `<ActiveFileTitle />` AND the active tab in `mainTabsStrip`, producing duplicate titles 15 pixels apart: `[← →] !index [!Land...] [!index] [+]`.
  - In `30-markdown-editor-pane.css`, `.markdownEditorPane .rfNodeNoteEditorBody` applied `padding-top: 9vh`, pushing the first line of every note 100+ pixels down the viewport into an artificial black void.
- **Resolution**:
  - Made `<ActiveFileTitle />` and `mainTabsStrip` mutually exclusive in `TabBar.tsx`: when tabs are visible (`tabs.length > 1 || tabs[0]?.isPinned`), `<ActiveFileTitle />` yields to the tab strip. When only a single unpinned note is active, `<ActiveFileTitle />` serves as the clean breadcrumb title.
  - Replaced `padding-top: 9vh` with `padding-top: 0` on `.rfNodeNoteEditorBody` in `30-markdown-editor-pane.css`, and set `padding-top: 18px; padding-bottom: 50vh;` on `.rfNodeNoteEditorRaw .cm-content` to match Rich mode's top padding, aligning Raw and Rich modes at a comfortable 18px below the toolbar.
- **Files Modified**:
  - `src/components/app/TabBar.tsx`
  - `src/styles/app/30-markdown-editor-pane.css`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.

---

## Patch 22: Keyboard Tab Navigation in Editor & Safari/Obsidian Ctrl+Tab Support
- **Problem**:
  - `next-tab` (`⌥⌘]`), `previous-tab` (`⌥⌘[`), `close-active-tab` (`⌘W`), and `activate-tab-1..9` (`⌥⌘1..9`) had `"allowInEditable": false` in `appCommandManifest.json`.
  - Consequently, whenever an author was actively typing inside a note or had the editor focused (the vast majority of PKM workflow time), keyboard shortcuts to cycle tabs or close tabs were completely ignored by `useCommandShortcuts`. Users were forced to mouse-click outside the note buffer to switch tabs.
  - Furthermore, standard macOS / Safari / Obsidian tab-cycling hotkeys (`⌃⇥` / `⌃⇧⇥`) were absent.
- **Resolution**:
  - Enabled `"allowInEditable": true` across `next-tab`, `previous-tab`, `close-active-tab`, and `activate-tab-1..9` in `appCommandManifest.json` and `useAppCommands.tsx`.
  - Added universal macOS `⌃⇥` (Control+Tab) and `⌃⇧⇥` (Control+Shift+Tab) keyboard listeners in `AppShell.tsx`, allowing authors to cycle tabs effortlessly without leaving the typing flow.
- **Files Modified**:
  - `src/shared/appCommandManifest.json`
  - `src/components/app/useAppCommands.tsx`
  - `src/components/app/AppShell.tsx`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.

---

## Patch 23: High-Density Desktop Shortcuts Architecture & Redundant Subtitle Elimination
- **Problem**:
  - The upstream shortcuts pane recycled a generic mobile-style stacked `SettingsRow` component for 60+ commands, wasting 75px per row. On a standard 1440p desktop viewport, only 5–7 shortcuts could fit on screen, forcing endless scrolling.
  - Tautological descriptions duplicated command names on every row ("Open Vault" stacked above "Open an existing vault"), doubling height for zero information gain.
  - Unassigned shortcuts were rendered as loud, dreary gray `"Disabled"` buttons taking up 180px, making the app appear broken rather than unassigned.
  - Persistent Trash and Reset buttons were rendered unconditionally on every row, visual clutter multiplying by 60.
- **Resolution**:
  - Re-architected `ShortcutsSettingsPane.tsx` into a high-density, two-column desktop master-detail layout:
    - **Category Rail (~190px sticky)**: Instant category navigation (`All Commands`, `Workspace`, `Navigation`, `Search`, `File Operations`, `Tabs`, `AI`, `Editor`, `Settings`) with live count badges.
    - **Top Controls**: Live search bar with clear button, filter status pills (`All`, `Assigned`, `Unassigned`), and a segmented **Concise vs Detailed** view toggle.
    - **Concise Mode (Default)**: Compact 38px rows displaying clean action labels with native hover tooltip `title={description}` for zero vertical waste.
    - **Detailed Mode**: Full multi-line layout displaying action labels and descriptions for users who prefer verbose reference.
    - **Keycap Badges**: Native macOS `<kbd>` pill styling, customized shortcut accent dot indicator, and subtle dashed `+ Assign` badges replacing the old `"Disabled"` buttons.
    - **Hover Actions**: Row actions (Remove / Reset to default) smoothly fade in on hover, eliminating 80px of permanent button clutter per row.
- **Files Modified**:
  - `src/components/settings/ShortcutsSettingsPane.tsx`
  - `src/styles/app/11-settings-misc.css`
  - `src/i18n/locales/en/commands.json`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.

---

## Patch 24: Sidebar Explorer Header Transposition & Stutter Elimination
- **Problem**:
  - In `SidebarContent.tsx`, the `sidebarFileTreeToolbar` (`FILES` header + Sort, Expand All, Collapse All controls) was rendered *above* `PinnedProjectsSection`, while the `FileTreePane` it controls was rendered *below* `PinnedProjectsSection`.
  - This inverted containment: `Pinned Projects` appeared as an arbitrary child of `FILES`, while the tree controls were physically severed from the tree canvas by the pinned projects block.
  - Furthermore, `FILES` repeated the gutter tab title `[📁 Files]` verbatim, producing a third visual title stutter in the sidebar.
- **Resolution**:
  - Transposed `PinnedProjectsSection` to the top of the sidebar panel, allowing pinned quick-access cards to lead cleanly.
  - Moved `sidebarFileTreeToolbar` immediately above `FileTreePane`, restoring direct physical proximity between tree controls (`Sort`, `Expand All`, `Collapse All`) and the file tree.
  - Renamed the header title from `FILES` to **`EXPLORER`** (`t("sidebar.explorer", "Explorer")`), aligning with standard IDE conventions (Antigravity IDE / VS Code) and completely eliminating the title stutter.
- **Files Modified**:
  - `src/components/app/SidebarContent.tsx`
  - `src/i18n/locales/en/shell.json`
  - `docs/FORK_PATCHES.md`
- **Upstream Conflict Risk**: Low.










