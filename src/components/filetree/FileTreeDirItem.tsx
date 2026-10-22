import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { useDraggable } from "@dnd-kit/react";
import { Folder01Icon, Folder03Icon, MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { m } from "motion/react";
import type { CSSProperties, KeyboardEvent, MouseEvent, MutableRefObject, Ref } from "react";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSpace } from "../../contexts";
import { showNativeContextMenu } from "../../lib/nativeContextMenu";
import { buildPathCopyMenuItems } from "../../lib/pathClipboard";
import { invoke } from "../../lib/tauri";
import type { FileTreeAppearance, FsEntry } from "../../lib/tauri";
import { Plus } from "../Icons";
import { InlineRenameInput } from "../InlineRenameInput";
import { AppearanceIcon } from "../AppearanceIcon";
import { isEditorTextColor } from "../editor/textColors";
import {
	FILE_TREE_ENTRY_SENSORS,
	FILE_TREE_ENTRY_TYPE,
	fileTreeEntryDragId,
	useFileTreeDirDropTargets,
} from "./fileTreeDnd";
import { buildRowStyle, rowVariants, springTransition } from "./fileTreeItemHelpers";
import { fileTreeAppearanceNativeMenu } from "./fileTreeNativeContextMenu";

interface FileTreeDirItemProps {
	entry: FsEntry;
	depth: number;
	isExpanded: boolean;
	isActive: boolean;
	isRenaming: boolean;
	onToggleDir: (dirPath: string) => void;
	onSelectDir: (dirPath: string) => void;
	onStartRename: () => void;
	onCommitRename: (dirPath: string, nextName: string) => Promise<boolean>;
	onCancelRename: () => void;
	onNewFileInDir: (dirPath: string) => unknown;
	onCreateFromTemplateInDir: (dirPath: string) => unknown;
	onImportFilesInDir: (dirPath: string) => unknown;
	onImportFolderInDir: (dirPath: string) => unknown;
	onRequestCreateFolder: (dirPath: string) => unknown;
	onDeletePath: (path: string, kind: "dir" | "file") => void;
	isSidebarFolderTab: boolean;
	canAddSidebarFolderTab: boolean;
	onToggleSidebarFolderTab: (dirPath: string) => unknown;
	onEnterDir?: (dirPath: string) => void;
	appearance?: FileTreeAppearance | null;
	onOpenAppearancePicker: () => void;
	fileCount?: number | null;
	isExternalDropTarget: boolean;
	onMoveClickSuppressRef: MutableRefObject<boolean>;
	virtualRowRef?: Ref<HTMLLIElement>;
	virtualRowStyle?: CSSProperties;
	virtualRowIndex?: number;
}

export const FileTreeDirItem = memo(function FileTreeDirItem({
	entry,
	depth,
	isExpanded,
	isActive,
	isRenaming,
	onToggleDir,
	onSelectDir,
	onStartRename,
	onCommitRename,
	onCancelRename,
	onNewFileInDir,
	onCreateFromTemplateInDir,
	onImportFilesInDir,
	onImportFolderInDir,
	onRequestCreateFolder,
	onDeletePath,
	isSidebarFolderTab,
	canAddSidebarFolderTab,
	onToggleSidebarFolderTab,
	onEnterDir,
	appearance,
	onOpenAppearancePicker,
	fileCount,
	isExternalDropTarget,
	onMoveClickSuppressRef,
	virtualRowRef,
	virtualRowStyle,
	virtualRowIndex,
}: FileTreeDirItemProps) {
	const { t } = useTranslation("shell");
	const { spacePath } = useSpace();
	const customColor =
		appearance?.color && isEditorTextColor(appearance.color) ? appearance.color : null;
	const isRootDir = entry.rel_path === "";
	const rowStyle = buildRowStyle(depth, entry.rel_path, customColor);
	const displayDirName = entry.name.trim() || "New Folder";
	const {
		ref: draggableRef,
		handleRef,
		isDragging,
	} = useDraggable({
		id: fileTreeEntryDragId("dir", entry.rel_path),
		type: FILE_TREE_ENTRY_TYPE,
		sensors: FILE_TREE_ENTRY_SENSORS,
		disabled: isRootDir,
		data: {
			path: entry.rel_path,
			kind: "dir",
		},
	});
	const { rowDroppableRef, isRowDropTarget } = useFileTreeDirDropTargets({
		relPath: entry.rel_path,
	});
	const setDragHandleRef = useCallback(
		(element: HTMLButtonElement | null) => {
			draggableRef(element);
			handleRef(element);
			rowDroppableRef(element);
		},
		[draggableRef, handleRef, rowDroppableRef],
	);
	const handleRevealInFinder = useCallback(async () => {
		try {
			await invoke("space_reveal_path", { path: entry.rel_path });
		} catch (error) {
			console.error("Failed to show folder in Finder", error);
		}
	}, [entry.rel_path]);
	const handleContextMenu = useCallback(
		(event: MouseEvent) => {
			if (isRootDir) {
				void showNativeContextMenu(event, [
					{
						label: t("fileTree.addFile"),
						action: () => void onNewFileInDir(""),
					},
					{
						label: t("fileTree.createFromTemplate"),
						action: () => void onCreateFromTemplateInDir(""),
					},
					{
						label: t("fileTree.addFolder"),
						action: () => void onRequestCreateFolder(""),
					},
					{
						label: t("fileTree.importFilesHere"),
						action: () => void onImportFilesInDir(""),
					},
					{
						label: t("fileTree.importFolderHere"),
						action: () => void onImportFolderInDir(""),
					},
					{ type: "separator" },
					{
						label: t("fileTree.showInFinder"),
						action: () => void handleRevealInFinder(),
					},
					...buildPathCopyMenuItems(spacePath, ""),
				]).catch((error: unknown) => {
					console.error("Failed to show root folder context menu", error);
				});
				return;
			}
			void showNativeContextMenu(event, [
				{
					label: t("fileTree.addFile"),
					action: () => void onNewFileInDir(entry.rel_path),
				},
				{
					label: t("fileTree.createFromTemplate"),
					action: () => void onCreateFromTemplateInDir(entry.rel_path),
				},
				{
					label: t("fileTree.addFolder"),
					action: () => void onRequestCreateFolder(entry.rel_path),
				},
				{
					label: t("fileTree.importFilesHere"),
					action: () => void onImportFilesInDir(entry.rel_path),
				},
				{
					label: t("fileTree.importFolderHere"),
					action: () => void onImportFolderInDir(entry.rel_path),
				},
				{ type: "separator" },
				...(onEnterDir
					? [
							{
								label: t("fileTree.focusFolder", "Focus Folder"),
								action: () => onEnterDir(entry.rel_path),
							},
							{ type: "separator" as const },
						]
					: []),
				{
					label: t("fileTree.showInFinder"),
					action: () => void handleRevealInFinder(),
				},
				...buildPathCopyMenuItems(spacePath, entry.rel_path),
				{ type: "separator" },
				{
					label: isSidebarFolderTab ? t("fileTree.removeFolderTab") : t("fileTree.addFolderTab"),
					enabled: isSidebarFolderTab || canAddSidebarFolderTab,
					action: () => void onToggleSidebarFolderTab(entry.rel_path),
				},
				{
					label: t("fileTree.rename"),
					action: onStartRename,
				},
				fileTreeAppearanceNativeMenu(onOpenAppearancePicker),
				{ type: "separator" },
				{
					label: t("fileTree.deleteFolder"),
					action: () => onDeletePath(entry.rel_path, "dir"),
				},
			]).catch((error: unknown) => {
				console.error("Failed to show folder context menu", error);
			});
		},
		[
			entry.rel_path,
			isRootDir,
			canAddSidebarFolderTab,
			handleRevealInFinder,
			isSidebarFolderTab,
			onEnterDir,
			onOpenAppearancePicker,
			onCreateFromTemplateInDir,
			onDeletePath,
			onImportFilesInDir,
			onImportFolderInDir,
			onNewFileInDir,
			onRequestCreateFolder,
			onStartRename,
			onToggleSidebarFolderTab,
			spacePath,
			t,
		],
	);

	return (
		<li
			ref={virtualRowRef}
			className={isActive ? "fileTreeItem active" : "fileTreeItem"}
			style={virtualRowStyle}
			data-index={virtualRowIndex}
		>
			<div className="fileTreeRowShell">
				{isRenaming ? (
					<div
						className="fileTreeRow"
						style={rowStyle}
						data-file-tree-kind="dir"
						data-file-tree-path={entry.rel_path}
					>
						<InlineRenameInput
							key={`${entry.rel_path}:${entry.name}`}
							initialValue={entry.name.trim() || "New Folder"}
							className="plainTextInput fileTreeRenameInput"
							placeholder="New Folder"
							containPointerEvents
							onCommit={(nextName) => onCommitRename(entry.rel_path, nextName)}
							onCancel={onCancelRename}
						/>
					</div>
				) : (
					<>
						<m.button
							ref={setDragHandleRef}
							type="button"
							className="fileTreeRow"
							onClick={() => {
								if (onMoveClickSuppressRef.current) {
									onMoveClickSuppressRef.current = false;
									return;
								}
								onSelectDir(entry.rel_path);
								if (entry.rel_path) {
									onToggleDir(entry.rel_path);
								}
							}}
							onContextMenu={handleContextMenu}
							style={rowStyle}
							variants={rowVariants}
							whileHover="hover"
							whileTap="tap"
							animate={isActive ? "active" : "idle"}
							transition={springTransition}
							title={entry.rel_path || entry.name || "Folder"}
							data-draggable="true"
							data-dragging={isDragging ? "true" : undefined}
							data-drop-target={isRowDropTarget || isExternalDropTarget ? "true" : undefined}
							data-has-custom-color={customColor ? "true" : "false"}
							data-file-tree-kind="dir"
							data-file-tree-path={entry.rel_path}
						>
							{appearance?.icon ? (
								<AppearanceIcon
									iconName={appearance.icon}
									size="var(--icon-md)"
									className="fileTreeChevron fileTreeFolderIcon"
								/>
							) : (
								<HugeiconsIcon
									icon={isExpanded ? Folder03Icon : Folder01Icon}
									size="var(--icon-sm)"
									className="fileTreeChevron fileTreeFolderIcon"
								/>
							)}
							<span className="fileTreeName">{displayDirName}</span>
							{typeof fileCount === "number" ? (
								<span className="fileTreeCounts">{fileCount}</span>
							) : null}
							<div className="fileTreeRowActions">
								<span
									role="button"
									tabIndex={0}
									className="fileTreeRowAction"
									title={t("fileTree.moreOptions", "More options")}
									aria-label={t("fileTree.moreOptions", "More options")}
									onClick={(event) => {
										event.preventDefault();
										event.stopPropagation();
										handleContextMenu(event);
									}}
									onKeyDown={(event: KeyboardEvent<HTMLSpanElement>) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											event.stopPropagation();
											handleContextMenu(event as unknown as MouseEvent);
										}
									}}
								>
									<HugeiconsIcon icon={MoreVerticalIcon} size="var(--icon-sm)" />
								</span>
								<span
									role="button"
									tabIndex={0}
									className="fileTreeRowAction"
									title={`Add file to ${displayDirName}`}
									aria-label={`Add file to ${displayDirName}`}
									onClick={(event) => {
										event.preventDefault();
										event.stopPropagation();
										void onNewFileInDir(entry.rel_path);
									}}
									onKeyDown={(event: KeyboardEvent<HTMLSpanElement>) => {
										if (event.key === "Enter" || event.key === " ") {
											event.preventDefault();
											event.stopPropagation();
											void onNewFileInDir(entry.rel_path);
										}
									}}
								>
									<Plus size="var(--icon-sm)" />
								</span>
							</div>
						</m.button>
					</>
				)}
			</div>
		</li>
	);
});
