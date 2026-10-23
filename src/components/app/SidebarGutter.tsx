import { AppearanceIcon } from "@/components/AppearanceIcon";
import { AppearancePicker } from "@/components/AppearancePicker";
import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { Settings } from "@/components/Icons";
import {
	AiBrain04Icon as AgentIcon,
	Archive03Icon as ArchiveIcon,
	Calendar03Icon as CalendarIcon,
	CalendarAdd01Icon as PeriodNoteIcon,
	CheckListIcon as TasksIcon,
	ChartRelationshipIcon as ConnectionsIcon,
	InboxIcon,
	Layout01Icon as TemplatesIcon,
	LibraryIcon as CollectionsIcon,
	NoteIcon as AllNotesIcon,
	Refresh04Icon as SyncIcon,
	SearchIcon,
	StickyNote03Icon as QuickNoteIcon,
} from "@hugeicons/core-free-icons";
import { useQuery } from "@tanstack/react-query";
import { memo, useCallback, useState, type MouseEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { showNativeContextMenu, type NativeContextMenuItem } from "../../lib/nativeContextMenu";
import { allDocsCountQueryOptions, formatAllDocsCountLabel } from "../../lib/navigationPrefetch";
import { defaultSpaceIconName, type SpaceDefinition } from "../../lib/spaceRegistry";
import type { SidebarOrder, SidebarVisibility } from "../../lib/settings/model";
import { type PeriodNotesEnabled, isPeriodNoteEnabled } from "../../lib/periodNotes";
import { useUILayoutContext } from "../../contexts";

function GutterInboxBadge({ defaultFolder, settingsSpacePath, spacePath }: { defaultFolder: string | null; settingsSpacePath: string | null; spacePath: string | null }) {
	const enabled = Boolean(defaultFolder && settingsSpacePath === spacePath);
	const count = useQuery({
		...allDocsCountQueryOptions(defaultFolder),
		enabled,
	});
	const label = formatAllDocsCountLabel(count.data ?? 0);
	if (!enabled || !label) return null;
	return <span className="sidebarGutterBadge">{label}</span>;
}

export interface SidebarGutterProps {
	sidebarOrder: SidebarOrder;
	sidebarVisibility: SidebarVisibility;
	aiEnabled: boolean;
	activeTopSection:
		| "agent"
		| "all-notes"
		| "inbox"
		| "archive"
		| "connections"
		| "databases"
		| "tasks"
		| null;
	onOpenAgent: () => void;
	onOpenInbox: () => void;
	onOpenArchive: () => void;
	onOpenAllDocs: () => void;
	onOpenDatabases: () => void;
	onOpenTasks: () => void;
	onOpenConnections: () => void;
	onOpenCalendar: () => void;
	onOpenSearch: () => void;
	onOpenQuickNote: () => void;
	onCreateFromTemplate: () => void;
	onGitSyncNow: () => void;
	onOpenPeriodNotes: () => void;
	periodNotesEnabled: PeriodNotesEnabled;
	archiveEnabled: boolean;
	settingsSpacePath: string | null;
	spacePath: string | null;
	spaces: SpaceDefinition[];
	activeSpacePath: string | null;
	onSelectSpace?: (path: string) => Promise<boolean>;
	onSetSpaceIcon?: (path: string, iconName: string | null) => Promise<void>;
	onCloseSpace?: (path: string) => Promise<void>;
	onOpenSpace?: () => Promise<void>;
	onCreateSpace?: () => Promise<void>;
	onRevealSpace?: () => void;
	onOpenSpaceSettings?: () => void;
	openSettings: () => void;
}

export const SidebarGutter = memo(function SidebarGutter({
	sidebarOrder,
	sidebarVisibility,
	aiEnabled,
	activeTopSection,
	onOpenAgent,
	onOpenInbox,
	onOpenArchive,
	onOpenAllDocs,
	onOpenDatabases,
	onOpenTasks,
	onOpenConnections,
	onOpenCalendar,
	onOpenSearch,
	onOpenQuickNote,
	onCreateFromTemplate,
	onGitSyncNow,
	onOpenPeriodNotes,
	periodNotesEnabled,
	archiveEnabled,
	settingsSpacePath,
	spacePath,
	spaces,
	activeSpacePath,
	onSelectSpace,
	onSetSpaceIcon,
	onCloseSpace,
	onOpenSpace,
	onCreateSpace,
	onRevealSpace,
	onOpenSpaceSettings,
	openSettings,
}: SidebarGutterProps) {
	const { t } = useTranslation("shell");
	const { defaultNewNoteFolder } = useUILayoutContext();
	const [iconPickerSpacePath, setIconPickerSpacePath] = useState<string | null>(null);

	const currentSpace = spaces.find((s) => s.path === activeSpacePath) ?? null;
	const iconPickerSpace = spaces.find((s) => s.path === iconPickerSpacePath) ?? null;

	const handleSpaceClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			const menuItems: NativeContextMenuItem[] = [];
			for (const space of spaces) {
				const isCurrent = space.path === activeSpacePath;
				menuItems.push({
					label: `${isCurrent ? "✓ " : "   "}${space.name}`,
					action: () => {
						if (!isCurrent && onSelectSpace) {
							void onSelectSpace(space.path);
						}
					},
				});
			}
			if (spaces.length > 0) {
				menuItems.push({ type: "separator" });
			}
			if (onOpenSpace) {
				menuItems.push({
					label: t("spaceSwitcher.openSpace", { defaultValue: "Open Vault…" }),
					action: () => {
						void onOpenSpace();
					},
				});
			}
			if (onCreateSpace) {
				menuItems.push({
					label: t("spaceSwitcher.createSpace", { defaultValue: "New Vault…" }),
					action: () => {
						void onCreateSpace();
					},
				});
			}
			if (currentSpace) {
				menuItems.push({ type: "separator" });
				menuItems.push({
					label: t("spaceSwitcher.changeIcon", { defaultValue: "Change Vault Icon…" }),
					action: () => setIconPickerSpacePath(currentSpace.path),
				});
				if (onRevealSpace) {
					menuItems.push({
						label: t("spaceSwitcher.revealInFinder", { defaultValue: "Reveal in Finder" }),
						action: () => onRevealSpace(),
					});
				}
				if (onOpenSpaceSettings) {
					menuItems.push({
						label: t("spaceSwitcher.spaceSettings", { defaultValue: "Vault Settings…" }),
						action: () => onOpenSpaceSettings(),
					});
				}
				if (spaces.length > 1 && onCloseSpace) {
					menuItems.push({ type: "separator" });
					menuItems.push({
						label: t("spaceSwitcher.closeSpace", { defaultValue: "Close Vault" }),
						action: () => void onCloseSpace(currentSpace.path),
					});
				}
			}
			void showNativeContextMenu(event, menuItems);
		},
		[
			activeSpacePath,
			currentSpace,
			onCloseSpace,
			onCreateSpace,
			onOpenSpace,
			onOpenSpaceSettings,
			onRevealSpace,
			onSelectSpace,
			spaces,
			t,
		],
	);

	const renderGutterButton = (key: string): ReactNode => {
		switch (key) {
			case "agent":
				if (!aiEnabled || !sidebarVisibility.agent) return null;
				return (
					<button
						key="agent"
						type="button"
						className="sidebarGutterBtn"
						data-sidebar-key="agent"
						data-active={activeTopSection === "agent" ? "true" : undefined}
						onClick={onOpenAgent}
						title={t("sidebar.agent", { defaultValue: "Agent" })}
						aria-label={t("sidebar.agent", { defaultValue: "Agent" })}
					>
						<HugeiconsIcon icon={AgentIcon} size="var(--icon-md)" />
					</button>
				);
			case "inbox":
				if (!sidebarVisibility.inbox) return null;
				return (
					<button
						key="inbox"
						type="button"
						className="sidebarGutterBtn"
						data-sidebar-key="inbox"
						data-active={activeTopSection === "inbox" ? "true" : undefined}
						onClick={onOpenInbox}
						title={t("sidebar.inbox", { defaultValue: "Inbox" })}
						aria-label={t("sidebar.inbox", { defaultValue: "Inbox" })}
					>
						<HugeiconsIcon icon={InboxIcon} size="var(--icon-md)" />
						<GutterInboxBadge
							defaultFolder={defaultNewNoteFolder}
							settingsSpacePath={settingsSpacePath}
							spacePath={spacePath}
						/>
					</button>
				);
			case "allNotes":
				if (!sidebarVisibility.allNotes) return null;
				return (
					<button
						key="allNotes"
						type="button"
						className="sidebarGutterBtn"
						data-sidebar-key="allNotes"
						data-active={activeTopSection === "all-notes" ? "true" : undefined}
						onClick={onOpenAllDocs}
						title={t("sidebar.allNotes", { defaultValue: "All Notes" })}
						aria-label={t("sidebar.allNotes", { defaultValue: "All Notes" })}
					>
						<HugeiconsIcon icon={AllNotesIcon} size="var(--icon-md)" />
					</button>
				);
			case "databases":
				if (!sidebarVisibility.databases) return null;
				return (
					<button
						key="databases"
						type="button"
						className="sidebarGutterBtn"
						data-sidebar-key="databases"
						data-active={activeTopSection === "databases" ? "true" : undefined}
						onClick={onOpenDatabases}
						title={t("sidebar.collections", { defaultValue: "Collections" })}
						aria-label={t("sidebar.collections", { defaultValue: "Collections" })}
					>
						<HugeiconsIcon icon={CollectionsIcon} size="var(--icon-md)" />
					</button>
				);
			case "tasks":
				if (!sidebarVisibility.tasks) return null;
				return (
					<button
						key="tasks"
						type="button"
						className="sidebarGutterBtn"
						data-sidebar-key="tasks"
						data-active={activeTopSection === "tasks" ? "true" : undefined}
						onClick={onOpenTasks}
						title={t("sidebar.tasks", { defaultValue: "Tasks" })}
						aria-label={t("sidebar.tasks", { defaultValue: "Tasks" })}
					>
						<HugeiconsIcon icon={TasksIcon} size="var(--icon-md)" />
					</button>
				);
			case "connections":
				if (!sidebarVisibility.connections) return null;
				return (
					<button
						key="connections"
						type="button"
						className="sidebarGutterBtn"
						data-sidebar-key="connections"
						onClick={onOpenConnections}
						title={t("sidebar.connections", { defaultValue: "Connections" })}
						aria-label={t("sidebar.connections", { defaultValue: "Connections" })}
					>
						<HugeiconsIcon icon={ConnectionsIcon} size="var(--icon-md)" />
					</button>
				);
			case "calendar":
				if (!sidebarVisibility.calendar) return null;
				return (
					<button
						key="calendar"
						type="button"
						className="sidebarGutterBtn"
						data-sidebar-key="calendar"
						onClick={onOpenCalendar}
						title={t("sidebar.calendar", { defaultValue: "Calendar" })}
						aria-label={t("sidebar.calendar", { defaultValue: "Calendar" })}
					>
						<HugeiconsIcon icon={CalendarIcon} size="var(--icon-md)" />
					</button>
				);
			case "search":
				if (!sidebarVisibility.search) return null;
				return (
					<button
						key="search"
						type="button"
						className="sidebarGutterBtn"
						data-sidebar-key="search"
						onClick={onOpenSearch}
						title={t("sidebar.search", { defaultValue: "Search / Quick Open" })}
						aria-label={t("sidebar.search", { defaultValue: "Search / Quick Open" })}
					>
						<HugeiconsIcon icon={SearchIcon} size="var(--icon-md)" />
					</button>
				);
			case "quickNote":
				if (!sidebarVisibility.quickNote) return null;
				return (
					<button
						key="quickNote"
						type="button"
						className="sidebarGutterBtn"
						data-sidebar-key="quickNote"
						onClick={onOpenQuickNote}
						title={t("sidebar.quickNote", { defaultValue: "Quick Note" })}
						aria-label={t("sidebar.quickNote", { defaultValue: "Quick Note" })}
					>
						<HugeiconsIcon icon={QuickNoteIcon} size="var(--icon-md)" />
					</button>
				);
			case "templates":
				if (!sidebarVisibility.templates) return null;
				return (
					<button
						key="templates"
						type="button"
						className="sidebarGutterBtn"
						data-sidebar-key="templates"
						onClick={onCreateFromTemplate}
						title={t("sidebar.templates", { defaultValue: "Templates" })}
						aria-label={t("sidebar.templates", { defaultValue: "Templates" })}
					>
						<HugeiconsIcon icon={TemplatesIcon} size="var(--icon-md)" />
					</button>
				);
			case "gitSync":
				if (!sidebarVisibility.gitSync) return null;
				return (
					<button
						key="gitSync"
						type="button"
						className="sidebarGutterBtn"
						data-sidebar-key="gitSync"
						onClick={onGitSyncNow}
						title={t("sidebar.gitSync", { defaultValue: "Git Sync" })}
						aria-label={t("sidebar.gitSync", { defaultValue: "Git Sync" })}
					>
						<HugeiconsIcon icon={SyncIcon} size="var(--icon-md)" />
					</button>
				);
			case "archive":
				if (!sidebarVisibility.archive || !archiveEnabled || settingsSpacePath !== spacePath) {
					return null;
				}
				return (
					<button
						key="archive"
						type="button"
						className="sidebarGutterBtn"
						data-sidebar-key="archive"
						data-active={activeTopSection === "archive" ? "true" : undefined}
						onClick={onOpenArchive}
						title={t("sidebar.archive", { defaultValue: "Archive" })}
						aria-label={t("sidebar.archive", { defaultValue: "Archive" })}
					>
						<HugeiconsIcon icon={ArchiveIcon} size="var(--icon-md)" />
					</button>
				);
			case "periodNotes":
				if (!sidebarVisibility.periodNotes || !isPeriodNoteEnabled("day", periodNotesEnabled)) {
					return null;
				}
				return (
					<button
						key="periodNotes"
						type="button"
						className="sidebarGutterBtn"
						data-sidebar-key="periodNotes"
						onClick={onOpenPeriodNotes}
						title={t("sidebar.dailyNotes", { defaultValue: "Period Notes" })}
						aria-label={t("sidebar.dailyNotes", { defaultValue: "Period Notes" })}
					>
						<HugeiconsIcon icon={PeriodNoteIcon} size="var(--icon-md)" />
					</button>
				);
			default:
				return null;
		}
	};

	return (
		<>
			<aside className="sidebarActivityGutter" aria-label="Activity Rail">
				<div className="sidebarGutterNavGroup">
					{sidebarOrder.map((key) => renderGutterButton(key))}
				</div>

				<div className="sidebarGutterFooterGroup">
					<button
						type="button"
						className="sidebarGutterBtn sidebarGutterSpaceBtn"
						onClick={handleSpaceClick}
						onContextMenu={handleSpaceClick}
						title={
							currentSpace
								? `${t("spaceSwitcher.label", { defaultValue: "Vault" })}: ${currentSpace.name}`
								: t("spaceSwitcher.label", { defaultValue: "Vault" })
						}
						aria-label={
							currentSpace
								? `${t("spaceSwitcher.label", { defaultValue: "Vault" })}: ${currentSpace.name}`
								: t("spaceSwitcher.label", { defaultValue: "Vault" })
						}
					>
						<AppearanceIcon
							iconName={currentSpace?.iconName ?? "folder"}
							size="var(--icon-md)"
							strokeWidth={1.75}
						/>
					</button>
					<button
						type="button"
						className="sidebarGutterBtn sidebarGutterSettingsBtn"
						onClick={() => openSettings()}
						title={`${t("sidebar.settings", { defaultValue: "Settings" })} (⌘,)`}
						aria-label={t("sidebar.settings", { defaultValue: "Settings" })}
					>
						<Settings size={18} />
					</button>
				</div>
			</aside>

			<AppearancePicker
				title={t("spaceSwitcher.chooseIcon", { defaultValue: "Choose vault icon" })}
				open={iconPickerSpace !== null}
				onOpenChange={(open) => {
					if (!open) setIconPickerSpacePath(null);
				}}
				iconValue={iconPickerSpace?.iconOverride ?? null}
				defaultIconName={
					iconPickerSpace ? defaultSpaceIconName(iconPickerSpace.path) : "folder"
				}
				showDefaultIcon
				allowEmoji
				onIconChange={(iconName) => {
					if (!iconPickerSpace || !onSetSpaceIcon) return;
					void onSetSpaceIcon(iconPickerSpace.path, iconName);
				}}
			/>
		</>
	);
});
