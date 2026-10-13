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
