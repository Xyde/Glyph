import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import {
	ArrangeByLettersAZIcon,
	Calendar03Icon,
	Clock01Icon,
	File01Icon,
	Folder01Icon,
	PinIcon,
	SearchIcon,
	Tag01Icon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FILE_TREE_SORT_MODES, fileTreeSortLabel } from "../../lib/fileTreeSort";
import { isFileTreeSortMode, type FileTreeSortMode } from "../../lib/settings";
import { basename } from "../../utils/path";
import { onWindowDragMouseDown } from "../../utils/window";
import { DEFAULT_FOLIO_SCOPE, type FolioScope } from "./folioScopes";

interface FolioScopeHeaderProps {
	scope?: FolioScope;
	noteCount?: number;
	searchQuery: string;
	sortMode: FileTreeSortMode;
	onSearchQueryChange: (query: string) => void;
	onSortModeChange: (sortMode: FileTreeSortMode) => void;
}

export const FolioScopeHeader = memo(function FolioScopeHeader({
	scope = DEFAULT_FOLIO_SCOPE,
	noteCount = 0,
	searchQuery,
	sortMode,
	onSearchQueryChange,
	onSortModeChange,
}: FolioScopeHeaderProps) {
	const { t } = useTranslation("shell");
	const sortIcon = sortMode.startsWith("name-")
		? ArrangeByLettersAZIcon
		: sortMode.startsWith("created-")
			? Calendar03Icon
			: Clock01Icon;

	const scopeDetails = useMemo(() => {
		switch (scope.kind) {
			case "folder": {
				const trimmed = scope.folderPrefix.trim().replace(/^\.?\/+/, "");
				const title = trimmed
					? basename(trimmed)
					: t("sidebar.explorer", { defaultValue: "Explorer" });
				return {
					icon: Folder01Icon,
					title,
					fullPath: trimmed || "./",
				};
			}
			case "tag":
				return {
					icon: Tag01Icon,
					title: `#${scope.tag}`,
					fullPath: scope.tag,
				};
			case "person":
				return {
					icon: UserIcon,
					title: `@${scope.handle}`,
					fullPath: scope.handle,
				};
			case "pinned":
				return {
					icon: PinIcon,
					title: t("sidebar.pinned", { defaultValue: "Pinned" }),
					fullPath: "pinned",
				};
			default:
				return {
					icon: File01Icon,
					title: t("tabs.allNotes", { defaultValue: "All Notes" }),
					fullPath: "all",
				};
		}
	}, [scope, t]);

	return (
		<header className="folioNotesHeader">
			<div
				className="folioNotesScopeHeader"
				data-tauri-drag-region
				onMouseDown={onWindowDragMouseDown}
			>
				<div className="folioNotesScopeInfo" title={scopeDetails.fullPath}>
					<HugeiconsIcon
						icon={scopeDetails.icon}
						size="var(--icon-sm)"
						className="folioNotesScopeIcon"
					/>
					<span className="folioNotesScopeTitle">{scopeDetails.title}</span>
					<span className="folioNotesScopeCount">{noteCount}</span>
				</div>
			</div>
			<div className="folioNotesControls">
				<label className="folioNotesSearch">
					<HugeiconsIcon icon={SearchIcon} size="var(--icon-md)" />
					<input
						type="text"
						inputMode="search"
						value={searchQuery}
						placeholder={t("folio.filter")}
						aria-label={t("folio.filter")}
						onChange={(event) => onSearchQueryChange(event.currentTarget.value)}
					/>
				</label>
				<label className="folioNotesSort">
					<HugeiconsIcon icon={sortIcon} size="var(--icon-md)" />
					<select
						className="folioNotesSortSelect"
						value={sortMode}
						aria-label={t("sidebar.sortNotes")}
						onChange={(event) => {
							const mode = event.currentTarget.value;
							if (isFileTreeSortMode(mode)) onSortModeChange(mode);
						}}
					>
						{FILE_TREE_SORT_MODES.map((mode) => (
							<option key={mode} value={mode}>
								{fileTreeSortLabel(mode)}
							</option>
						))}
					</select>
				</label>
			</div>
		</header>
	);
});
