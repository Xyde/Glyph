import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { cn } from "@/lib/utils";
import { ReloadIcon } from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShortcutBindings } from "../../hooks/useShortcutBindings";
import {
	type ShortcutBindings,
	findShortcutConflict,
	resetShortcutBinding,
	setShortcutBinding,
} from "../../lib/settings";
import {
	type Shortcut,
	areShortcutsEqual,
	isShortcutModifierKey,
	normalizeShortcut,
	shortcutFromKeyboardEvent,
	validateConfigurableShortcut,
} from "../../lib/shortcuts";
import {
	formatShortcutForPlatform,
	formatShortcutPartsForPlatform,
} from "../../lib/shortcuts/platform";
import {
	SHORTCUT_CATEGORIES,
	type ShortcutCategory,
	getShortcutActionDefinition,
} from "../../lib/shortcuts/registry";
import { Plus, Search, Trash2, X } from "../Icons";

type FilterStatus = "all" | "assigned" | "unassigned";
type ViewMode = "concise" | "detailed";

function hasPressedModifier(shortcut: Shortcut | null) {
	return Boolean(shortcut?.meta || shortcut?.ctrl || shortcut?.alt || shortcut?.shift);
}

function formatRecordingPrompt(draft: Shortcut | null) {
	if (!draft || !hasPressedModifier(draft)) return "Press shortcut...";
	const parts = formatShortcutPartsForPlatform({
		...draft,
		key: "",
	}).filter(Boolean);
	return `${parts.join("")}...`;
}

interface ShortcutCaptureEvent {
	key: string;
	code: string;
	metaKey: boolean;
	ctrlKey: boolean;
	altKey: boolean;
	shiftKey: boolean;
	preventDefault: () => void;
	stopPropagation: () => void;
}

export function ShortcutsSettingsPane() {
	const { t } = useTranslation("commands");
	const { actionsWithBindings, bindings } = useShortcutBindings();

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | "all">("all");
	const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
	const [viewMode, setViewMode] = useState<ViewMode>("concise");

	const [recordingActionId, setRecordingActionId] = useState<string | null>(null);
	const [recordingDraft, setRecordingDraft] = useState<Shortcut | null>(null);
	const [busyActionId, setBusyActionId] = useState<string | null>(null);
	const [error, setError] = useState("");

	// Total and per-category counts
	const categoryCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const action of actionsWithBindings) {
			counts[action.category] = (counts[action.category] || 0) + 1;
		}
		return counts;
	}, [actionsWithBindings]);

	// Actions filtered by selected category
	const categoryFilteredActions = useMemo(() => {
		if (selectedCategory === "all") return actionsWithBindings;
		return actionsWithBindings.filter((action) => action.category === selectedCategory);
	}, [actionsWithBindings, selectedCategory]);

	// Counts within the selected category for status pills
	const statusCounts = useMemo(() => {
		let assigned = 0;
		let unassigned = 0;
		for (const action of categoryFilteredActions) {
			if (action.binding) assigned++;
			else unassigned++;
		}
		return {
			all: categoryFilteredActions.length,
			assigned,
			unassigned,
		};
	}, [categoryFilteredActions]);

	// Actions filtered by status pill
	const statusFilteredActions = useMemo(() => {
		if (filterStatus === "assigned") {
			return categoryFilteredActions.filter((action) => Boolean(action.binding));
		}
		if (filterStatus === "unassigned") {
			return categoryFilteredActions.filter((action) => !action.binding);
		}
		return categoryFilteredActions;
	}, [categoryFilteredActions, filterStatus]);

	// Actions filtered by search text
	const searchFilteredActions = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		if (!query) return statusFilteredActions;
		return statusFilteredActions.filter((action) => {
			const binding = action.binding ? formatShortcutForPlatform(action.binding).toLowerCase() : "";
			const label = t(`commands.${action.id}.label`).toLowerCase();
			const description = t(`commands.${action.id}.description`).toLowerCase();
			const category = t(`categories.${action.category}`).toLowerCase();
			return (
				label.includes(query) ||
				description.includes(query) ||
				category.includes(query) ||
				binding.includes(query)
			);
		});
	}, [statusFilteredActions, searchQuery, t]);

	// Grouping for rendering
	const groupedActions = useMemo(() => {
		const groups = new Map<ShortcutCategory, typeof searchFilteredActions>();
		for (const category of SHORTCUT_CATEGORIES) {
			if (selectedCategory === "all" || selectedCategory === category) {
				groups.set(category, []);
			}
		}
		for (const action of searchFilteredActions) {
			groups.get(action.category)?.push(action);
		}
		return Array.from(groups.entries()).filter(([, actions]) => actions.length > 0);
	}, [searchFilteredActions, selectedCategory]);

	const handleDisable = async (actionId: string) => {
		setBusyActionId(actionId);
		setError("");
		try {
			await setShortcutBinding(actionId, null);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Failed to disable shortcut.");
		} finally {
			setBusyActionId(null);
		}
	};

	const handleReset = async (actionId: string) => {
		setBusyActionId(actionId);
		setError("");
		try {
			await resetShortcutBinding(actionId);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Failed to reset shortcut.");
		} finally {
			setBusyActionId(null);
			setRecordingActionId((current) => (current === actionId ? null : current));
		}
	};

	const handleRecordKeyDown = useCallback(
		async (actionId: string, event: ShortcutCaptureEvent) => {
			event.preventDefault();
			event.stopPropagation();
			setError("");
			if (event.key === "Escape") {
				setRecordingActionId(null);
				setRecordingDraft(null);
				return;
			}
			const nextBinding = shortcutFromKeyboardEvent(event);
			if (isShortcutModifierKey(event.key)) {
				setRecordingDraft(nextBinding);
				return;
			}
			const validation = validateConfigurableShortcut(nextBinding);
			if (!validation.valid) {
				setError(validation.reason ?? "Invalid shortcut.");
				return;
			}
			const conflictId = findShortcutConflict(nextBinding, bindings as ShortcutBindings, actionId);
			if (conflictId) {
				const conflict = getShortcutActionDefinition(conflictId);
				setError(
					`${formatShortcutForPlatform(nextBinding)} is already used by ${
						conflict ? t(`commands.${conflictId}.label`) : conflictId
					}.`,
				);
				return;
			}
			setBusyActionId(actionId);
			try {
				await setShortcutBinding(actionId, nextBinding);
				setRecordingActionId(null);
				setRecordingDraft(null);
			} catch (cause) {
				setError(cause instanceof Error ? cause.message : "Failed to save shortcut.");
			} finally {
				setBusyActionId(null);
			}
		},
		[bindings, t],
	);

	const handleRecordKeyUp = useCallback(
		(event: ShortcutCaptureEvent) => {
			if (!recordingActionId || !isShortcutModifierKey(event.key)) return;
			event.preventDefault();
			event.stopPropagation();
			const nextDraft = normalizeShortcut({
				key: "",
				meta: event.metaKey,
				ctrl: event.ctrlKey,
				alt: event.altKey,
				shift: event.shiftKey,
			});
			setRecordingDraft(hasPressedModifier(nextDraft) ? nextDraft : null);
		},
		[recordingActionId],
	);

	useEffect(() => {
		if (!recordingActionId) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			event.stopImmediatePropagation();
			void handleRecordKeyDown(recordingActionId, event);
		};
		const handleKeyUp = (event: KeyboardEvent) => {
			event.stopImmediatePropagation();
			handleRecordKeyUp(event);
		};

		window.addEventListener("keydown", handleKeyDown, { capture: true });
		window.addEventListener("keyup", handleKeyUp, { capture: true });
		return () => {
			window.removeEventListener("keydown", handleKeyDown, { capture: true });
			window.removeEventListener("keyup", handleKeyUp, { capture: true });
		};
	}, [recordingActionId, handleRecordKeyDown, handleRecordKeyUp]);

	return (
		<div className="settingsPane shortcutsPane">
			<div className="shortcutsLayout">
				{/* Left Sidebar Rail */}
				<aside className="shortcutsSidebar">
					<div className="shortcutsSidebarHeader">
						{t("categories.header", "Categories")}
					</div>
					<nav className="shortcutsCategoryList">
						<button
							type="button"
							className={cn("shortcutsCategoryButton", selectedCategory === "all" && "is-active")}
							onClick={() => setSelectedCategory("all")}
							data-settings-search-id="shortcuts-all"
						>
							<span className="shortcutsCategoryName">{t("ui.allCategories", "All Commands")}</span>
							<span className="shortcutsCategoryCount">{actionsWithBindings.length}</span>
						</button>
						{SHORTCUT_CATEGORIES.map((category) => {
							const count = categoryCounts[category] || 0;
							return (
								<button
									key={category}
									type="button"
									className={cn(
										"shortcutsCategoryButton",
										selectedCategory === category && "is-active",
									)}
									onClick={() => setSelectedCategory(category)}
									data-settings-search-id={`shortcuts-${category}`}
								>
									<span className="shortcutsCategoryName">{t(`categories.${category}`)}</span>
									<span className="shortcutsCategoryCount">{count}</span>
								</button>
							);
						})}
					</nav>
				</aside>

				{/* Right Main Content */}
				<main className="shortcutsContent">
					{/* Top Controls: Search and View Mode */}
					<div className="shortcutsControls">
						<div className="shortcutsSearchBox">
							<Search size="var(--icon-sm)" className="shortcutsSearchIcon" />
							<input
								className="shortcutsSearchInput"
								type="search"
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								placeholder={t("ui.searchPlaceholder", "Search commands, categories, or shortcuts...")}
								aria-label="Search shortcuts"
							/>
							{searchQuery ? (
								<button
									type="button"
									className="shortcutsSearchClear"
									onClick={() => setSearchQuery("")}
									aria-label="Clear search"
								>
									<X size="var(--icon-xs)" />
								</button>
							) : null}
						</div>

						{/* View Mode Toggle: Concise vs Detailed */}
						<div className="shortcutsViewModeToggle" role="group" aria-label="View mode">
							<button
								type="button"
								className={cn(
									"shortcutsViewModeButton",
									viewMode === "concise" && "is-active",
								)}
								onClick={() => setViewMode("concise")}
								title="Single-line compact view"
							>
								{t("ui.concise", "Concise")}
							</button>
							<button
								type="button"
								className={cn(
									"shortcutsViewModeButton",
									viewMode === "detailed" && "is-active",
								)}
								onClick={() => setViewMode("detailed")}
								title="Multi-line detailed view with descriptions"
							>
								{t("ui.detailed", "Detailed")}
							</button>
						</div>
					</div>

					{/* Filter Status Pills */}
					<div className="shortcutsFilterPillRow">
						<button
							type="button"
							className={cn(
								"shortcutsFilterPill",
								filterStatus === "all" && "is-active",
							)}
							onClick={() => setFilterStatus("all")}
						>
							{t("ui.filterAll", "All")} ({statusCounts.all})
						</button>
						<button
							type="button"
							className={cn(
								"shortcutsFilterPill",
								filterStatus === "assigned" && "is-active",
							)}
							onClick={() => setFilterStatus("assigned")}
						>
							{t("ui.filterAssigned", "Assigned")} ({statusCounts.assigned})
						</button>
						<button
							type="button"
							className={cn(
								"shortcutsFilterPill",
								filterStatus === "unassigned" && "is-active",
							)}
							onClick={() => setFilterStatus("unassigned")}
						>
							{t("ui.filterUnassigned", "Unassigned")} ({statusCounts.unassigned})
						</button>
					</div>

					{/* Error Banner */}
					{error ? (
						<div className="shortcutError">
							<span>{error}</span>
							<button
								type="button"
								className="shortcutErrorDismiss"
								onClick={() => setError("")}
								aria-label="Dismiss error"
							>
								<X size="var(--icon-xs)" />
							</button>
						</div>
					) : null}

					{/* Shortcuts List Card */}
					<div className="shortcutsListCard">
						{groupedActions.length === 0 ? (
							<div className="shortcutsEmptyState">
								<p>{t("ui.noResults", "No shortcuts found matching your search.")}</p>
								{(searchQuery || filterStatus !== "all" || selectedCategory !== "all") && (
									<button
										type="button"
										className="shortcutsResetFiltersButton"
										onClick={() => {
											setSearchQuery("");
											setFilterStatus("all");
											setSelectedCategory("all");
										}}
									>
										{t("ui.clearFilters", "Clear all filters")}
									</button>
								)}
							</div>
						) : (
							groupedActions.map(([category, categoryActions]) => (
								<section
									key={category}
									className="shortcutsCategoryGroup"
									data-settings-section-title={t(`categories.${category}`)}
								>
									{selectedCategory === "all" ? (
										<div className="shortcutsCategoryHeader">
											<span className="shortcutsCategoryHeaderTitle">
												{t(`categories.${category}`)}
											</span>
											<span className="shortcutsCategoryHeaderCount">
												{categoryActions.length}
											</span>
										</div>
									) : null}
									<div className="shortcutsRowsContainer">
										{categoryActions.map((action) => {
											const isRecording = recordingActionId === action.id;
											const isBusy = busyActionId === action.id;
											const normDefault = action.defaultBinding
												? normalizeShortcut(action.defaultBinding)
												: null;
											const isCustomized = !areShortcutsEqual(action.binding, normDefault);
											const label = t(`commands.${action.id}.label`);
											const description = t(`commands.${action.id}.description`);

											return (
												<div
													key={action.id}
													className={cn(
														"shortcutRow",
														viewMode === "detailed" && "is-detailed",
														isRecording && "is-recording-row",
													)}
													data-settings-row-title={label}
													data-settings-search-id={action.id}
													title={viewMode === "concise" ? description : undefined}
												>
													<div className="shortcutLabelArea">
														<span className="shortcutLabel">{label}</span>
														{viewMode === "detailed" && description ? (
															<span className="shortcutDescription">{description}</span>
														) : null}
													</div>

													<div className="shortcutTrailing">
														<div className="shortcutRowActions">
															{action.binding ? (
																<button
																	type="button"
																	className="shortcutRowActionBtn"
																	disabled={isBusy}
																	onClick={() => void handleDisable(action.id)}
																	aria-label={`Remove shortcut for ${label}`}
																	title={t("ui.clearShortcut", "Remove shortcut")}
																>
																	<Trash2 size="var(--icon-sm)" />
																</button>
															) : null}
															{isCustomized ? (
																<button
																	type="button"
																	className="shortcutRowActionBtn"
																	disabled={isBusy}
																	onClick={() => void handleReset(action.id)}
																	aria-label={`Reset shortcut for ${label}`}
																	title={t("ui.resetShortcut", "Reset to default")}
																>
																	<HugeiconsIcon icon={ReloadIcon} size="var(--icon-sm)" />
																</button>
															) : null}
														</div>

														<button
															type="button"
															className={cn(
																"shortcutKeycap",
																isRecording && "is-recording",
																!action.binding && !isRecording && "is-unassigned",
															)}
															onClick={() => {
																setError("");
																setRecordingDraft(null);
																setRecordingActionId((current) =>
																	current === action.id ? null : action.id,
																);
															}}
															disabled={isBusy}
															aria-label={
																action.binding
																	? `${label}: ${formatShortcutForPlatform(action.binding)}. Click to change.`
																	: `${label}: Unassigned. Click to assign shortcut.`
															}
														>
															{isRecording ? (
																<span className="shortcutRecordingText">
																	{formatRecordingPrompt(recordingDraft)}
																</span>
															) : action.binding ? (
																<span className="shortcutCombo">
																	{formatShortcutPartsForPlatform(action.binding).map(
																		(part, partIndex) => (
																			<kbd
																				key={`${action.id}-${part}-${partIndex}`}
																				className="shortcutKbdPart"
																			>
																				{part}
																			</kbd>
																		),
																	)}
																	{isCustomized ? (
																		<span
																			className="shortcutCustomDot"
																			title={t("ui.customized", "Customized")}
																		/>
																	) : null}
																</span>
															) : (
																<span className="shortcutUnassignedPlaceholder">
																	<Plus size="11px" className="shortcutUnassignedPlus" />
																	<span>{t("ui.assign", "Assign")}</span>
																</span>
															)}
														</button>
													</div>
												</div>
											);
										})}
									</div>
								</section>
							))
						)}
					</div>
				</main>
			</div>
		</div>
	);
}
