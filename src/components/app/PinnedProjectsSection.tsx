import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { Folder01Icon, MoreVerticalIcon, NoteIcon, PinIcon } from "@hugeicons/core-free-icons";
import { useQuery } from "@tanstack/react-query";
import { memo, type MouseEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { showNativeContextMenu } from "../../lib/nativeContextMenu";
import { invoke } from "../../lib/tauri";
import type { FileTreeAppearance } from "../../lib/tauri";
import { basename } from "../../utils/path";
import { AppearanceIcon } from "../AppearanceIcon";

function formatCompactAge(value: string | null | undefined): string {
	if (!value) return "";
	const timestamp = Date.parse(value);
	if (!Number.isFinite(timestamp)) return "";
	const elapsedMs = Math.max(0, Date.now() - timestamp);
	const minute = 60 * 1000;
	const hour = 60 * minute;
	const day = 24 * hour;
	const week = 7 * day;
	if (elapsedMs < minute) return "now";
	if (elapsedMs < hour) return `${Math.floor(elapsedMs / minute)}m`;
	if (elapsedMs < day) return `${Math.floor(elapsedMs / hour)}h`;
	if (elapsedMs < week) return `${Math.floor(elapsedMs / day)}d`;
	return `${Math.floor(elapsedMs / week)}w`;
}

function PinnedProjectItem({
	folderPath,
	isActive,
	appearance,
	onSelectFolder,
	onOpenFile,
	onRemoveFolder,
}: {
	folderPath: string;
	isActive: boolean;
	appearance?: FileTreeAppearance;
	onSelectFolder: (path: string) => void;
	onOpenFile: (path: string) => void;
	onRemoveFolder: (path: string) => void;
}) {
	const { t } = useTranslation("shell");
	const folderName = basename(folderPath) || folderPath;

	const latestNoteQuery = useQuery({
		queryKey: ["pinned-project-latest-note", folderPath],
		queryFn: async () => {
			const items = await invoke("all_docs_list", {
				folder_prefix: folderPath,
				limit: 1,
				sort_mode: "modified-desc",
			});
			return items[0] ?? null;
		},
		staleTime: 5_000,
	});

	const latestNote = latestNoteQuery.data;

	const handleContextMenu = useCallback(
		(event: MouseEvent) => {
			void showNativeContextMenu(event, [
				{
					label: t("sidebar.removeFolderTab", { folder: folderName }),
					action: () => onRemoveFolder(folderPath),
				},
			]).catch((error: unknown) => {
				console.error("Failed to show pinned project context menu", error);
			});
		},
		[folderName, folderPath, onRemoveFolder, t],
	);

	return (
		<div className="sidebarPinnedProject" data-active={isActive ? "true" : undefined}>
			<div
				className="sidebarPinnedProjectHeader"
				role="button"
				tabIndex={0}
				onClick={() => onSelectFolder(folderPath)}
				onContextMenu={handleContextMenu}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						onSelectFolder(folderPath);
					}
				}}
				title={folderPath}
			>
				{appearance?.icon ? (
					<AppearanceIcon
						iconName={appearance.icon}
						size="var(--icon-sm)"
						className="sidebarPinnedProjectIcon"
					/>
				) : (
					<HugeiconsIcon
						icon={Folder01Icon}
						size="var(--icon-sm)"
						className="sidebarPinnedProjectIcon"
					/>
				)}
				<span className="sidebarPinnedProjectName">{folderName}</span>
				<button
					type="button"
					className="sidebarPinnedProjectAction"
					title={t("sidebar.removeFolderTab", { folder: folderName })}
					aria-label={t("sidebar.removeFolderTab", { folder: folderName })}
					onClick={(e) => {
						e.stopPropagation();
						onRemoveFolder(folderPath);
					}}
				>
					<HugeiconsIcon icon={MoreVerticalIcon} size="var(--icon-xs)" />
				</button>
			</div>

			{latestNote ? (
				<button
					type="button"
					className="sidebarPinnedProjectNote"
					onClick={(e) => {
						e.stopPropagation();
						onOpenFile(latestNote.note_path);
					}}
					title={latestNote.note_path}
				>
					<HugeiconsIcon
						icon={NoteIcon}
						size="var(--icon-xs)"
						className="sidebarPinnedProjectNoteIcon"
					/>
					<span className="sidebarPinnedProjectNoteTitle">
						{latestNote.title || basename(latestNote.note_path)}
					</span>
					{latestNote.updated ? (
						<span className="sidebarPinnedProjectNoteAge">
							{formatCompactAge(latestNote.updated)}
						</span>
					) : null}
				</button>
			) : null}
		</div>
	);
}

interface PinnedProjectsSectionProps {
	folders: string[];
	activeDirPath: string | null;
	onSelectFolder: (path: string) => void;
	onOpenFile: (path: string) => void;
	onRemoveFolder: (path: string) => void;
	itemAppearance: Record<string, FileTreeAppearance>;
}

export const PinnedProjectsSection = memo(function PinnedProjectsSection({
	folders,
	activeDirPath,
	onSelectFolder,
	onOpenFile,
	onRemoveFolder,
	itemAppearance,
}: PinnedProjectsSectionProps) {
	const { t } = useTranslation("shell");
	if (folders.length === 0) return null;

	return (
		<div className="sidebarPinnedProjectsSection">
			<div className="sidebarPinnedProjectsHeader">
				<HugeiconsIcon icon={PinIcon} size="var(--icon-xs)" className="sidebarPinnedProjectsPinIcon" />
				<span className="sidebarPinnedProjectsTitle">{t("sidebar.pinnedProjects")}</span>
			</div>
			<div className="sidebarPinnedProjectsList">
				{folders.map((folderPath) => (
					<PinnedProjectItem
						key={folderPath}
						folderPath={folderPath}
						isActive={activeDirPath === folderPath}
						appearance={itemAppearance[folderPath]}
						onSelectFolder={onSelectFolder}
						onOpenFile={onOpenFile}
						onRemoveFolder={onRemoveFolder}
					/>
				))}
			</div>
		</div>
	);
});
