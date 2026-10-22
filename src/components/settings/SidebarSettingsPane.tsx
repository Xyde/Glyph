import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { extractErrorMessage } from "../../lib/errorUtils";
import { loadSettings } from "../../lib/settings";
import { DURABLE_SETTINGS, writeSidebarLayout } from "../../lib/settings/definitions";
import {
	DEFAULT_SIDEBAR_LAYOUT_STYLE,
	DEFAULT_SIDEBAR_ORDER,
	DEFAULT_SIDEBAR_PINNED_STYLE,
	DEFAULT_SIDEBAR_VISIBILITY,
	isSidebarLayoutStyle,
	isSidebarPinnedStyle,
	type SidebarLayoutStyle,
	type SidebarOrder,
	type SidebarPinnedStyle,
	type SidebarVisibility,
	type SidebarVisibilityKey,
} from "../../lib/settings/model";
import { useTauriEvent } from "../../lib/tauriEvents";
import { RefreshCw } from "../Icons";
import { Button } from "../ui/shadcn/button";
import { SidebarItems } from "./SidebarItems";
import { SettingsRow, SettingsSection } from "./SettingsScaffold";
import { SettingsSelect } from "./SettingsSelect";
import { useSettingsValue } from "./useSettingsValue";

export function SidebarSettingsPane() {
	const settingsQuery = useQuery({
		queryKey: ["sidebar-settings"],
		queryFn: () => loadSettings(),
		refetchOnWindowFocus: false,
	});

	if (settingsQuery.error) {
		return (
			<div className="settingsPane settingsError">{extractErrorMessage(settingsQuery.error)}</div>
		);
	}
	if (!settingsQuery.data) return null;

	return (
		<SidebarSettingsContent
			key={settingsQuery.dataUpdatedAt}
			initialVisibility={settingsQuery.data.ui.sidebarVisibility}
			initialOrder={settingsQuery.data.ui.sidebarOrder}
			initialPinnedStyle={settingsQuery.data.ui.sidebarPinnedStyle}
			initialLayoutStyle={settingsQuery.data.ui.sidebarLayoutStyle}
		/>
	);
}

function SidebarSettingsContent({
	initialVisibility,
	initialOrder,
	initialPinnedStyle = DEFAULT_SIDEBAR_PINNED_STYLE,
	initialLayoutStyle = DEFAULT_SIDEBAR_LAYOUT_STYLE,
}: {
	initialVisibility: SidebarVisibility;
	initialOrder: SidebarOrder;
	initialPinnedStyle?: SidebarPinnedStyle;
	initialLayoutStyle?: SidebarLayoutStyle;
}) {
	const { t } = useTranslation("settings.sidebar");
	const [error, setError] = useState("");
	const [isResetting, setIsResetting] = useState(false);
	const visibility = useSettingsValue(
		initialVisibility,
		DURABLE_SETTINGS.sidebarVisibility.write,
		setError,
	);
	const order = useSettingsValue(initialOrder, DURABLE_SETTINGS.sidebarOrder.write, setError);
	const pinnedStyle = useSettingsValue(
		initialPinnedStyle,
		DURABLE_SETTINGS.sidebarPinnedStyle.write,
		setError,
	);
	const layoutStyle = useSettingsValue(
		initialLayoutStyle,
		DURABLE_SETTINGS.sidebarLayoutStyle.write,
		setError,
	);

	useTauriEvent("settings:updated", (payload) => {
		if (payload.ui?.sidebarVisibility) visibility.setValue(payload.ui.sidebarVisibility);
		if (payload.ui?.sidebarOrder) order.setValue(payload.ui.sidebarOrder);
		if (payload.ui?.sidebarPinnedStyle) pinnedStyle.setValue(payload.ui.sidebarPinnedStyle);
		if (payload.ui?.sidebarLayoutStyle) layoutStyle.setValue(payload.ui.sidebarLayoutStyle);
	});

	const onVisibilityChange = useCallback(
		(key: SidebarVisibilityKey, visible: boolean) => {
			visibility.onChange({
				...visibility.value,
				[key]: visible,
				...(key === "newNote" ? { newCanvas: visible } : {}),
			});
		},
		[visibility.onChange, visibility.value],
	);

	const onReset = useCallback(() => {
		setError("");
		setIsResetting(true);
		void writeSidebarLayout({
			visibility: DEFAULT_SIDEBAR_VISIBILITY,
			order: DEFAULT_SIDEBAR_ORDER,
		})
			.then(() => {
				visibility.setValue(DEFAULT_SIDEBAR_VISIBILITY);
				order.setValue(DEFAULT_SIDEBAR_ORDER);
			})
			.catch((cause: unknown) => {
				setError(cause instanceof Error ? cause.message : t("resetError"));
			})
			.finally(() => setIsResetting(false));
	}, [order.setValue, visibility.setValue, t]);

	const disabled = visibility.isSaving || order.isSaving || isResetting;

	return (
		<div className="settingsPane">
			{error ? <div className="settingsError">{error}</div> : null}
			<div className="settingsGrid">
				<SettingsSection
					title={t("sectionTitle")}
					description={t("sectionDescription")}
					aside={
						<Button
							type="button"
							variant="outline"
							size="icon-sm"
							aria-label={t("resetToDefaults")}
							title={t("resetToDefaults")}
							disabled={disabled}
							onClick={onReset}
						>
							<RefreshCw size="var(--icon-md)" aria-hidden="true" />
						</Button>
					}
				>
					<SidebarItems
						order={order.value}
						visibility={visibility.value}
						disabled={disabled}
						onReorder={order.onChange}
						onVisibilityChange={onVisibilityChange}
					/>
				</SettingsSection>
				<SettingsSection
					title={t("layoutStyleTitle")}
					description={t("layoutStyleDescription")}
				>
					<SettingsRow
						label={t("layoutStyleLabel")}
						description={t("layoutStyleHelp")}
						htmlFor="settings-layout-style-select"
					>
						<SettingsSelect
							id="settings-layout-style-select"
							value={layoutStyle.value}
							disabled={disabled}
							onChange={(event) => {
								const next = event.target.value;
								if (isSidebarLayoutStyle(next)) {
									layoutStyle.onChange(next);
								}
							}}
						>
							<option value="gutter">{t("layoutStyleGutter")}</option>
							<option value="stacked">{t("layoutStyleStacked")}</option>
						</SettingsSelect>
					</SettingsRow>
				</SettingsSection>

				<SettingsSection
					title={t("pinnedStyleTitle")}
					description={t("pinnedStyleDescription")}
				>
					<SettingsRow
						label={t("pinnedStyleLabel")}
						description={t("pinnedStyleHelp")}
						htmlFor="settings-pinned-style-select"
					>
						<SettingsSelect
							id="settings-pinned-style-select"
							value={pinnedStyle.value}
							disabled={disabled}
							onChange={(event) => {
								const next = event.target.value;
								if (isSidebarPinnedStyle(next)) {
									pinnedStyle.onChange(next);
								}
							}}
						>
							<option value="classic">{t("pinnedStyleClassic")}</option>
							<option value="projects">{t("pinnedStyleProjects")}</option>
						</SettingsSelect>
					</SettingsRow>
				</SettingsSection>
			</div>
		</div>
	);
}
