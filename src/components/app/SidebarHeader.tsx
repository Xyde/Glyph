import { NavArrowLeftIcon, NavArrowRightIcon, SidebarToggleIcon } from "@/components/Icons";
import { useTranslation } from "react-i18next";
import { useUILayoutContext, useUpdaterContext } from "../../contexts";
import { onWindowDragMouseDown } from "../../utils/window";
import { WindowChromeUpdateButton } from "./WindowChromeUpdateButton";

interface SidebarHeaderProps {
	canGoBack?: boolean;
	canGoForward?: boolean;
	onGoBack?: () => void;
	onGoForward?: () => void;
}

export function SidebarHeader({
	canGoBack = false,
	canGoForward = false,
	onGoBack,
	onGoForward,
}: SidebarHeaderProps) {
	const autoUpdater = useUpdaterContext();
	const { sidebarCollapsed, setSidebarCollapsed } = useUILayoutContext();
	const { t } = useTranslation("shell");

	return (
		<>
			<div
				aria-hidden="true"
				className="sidebarDragLayer"
				data-tauri-drag-region
				onMouseDown={onWindowDragMouseDown}
			/>
			<div className="sidebarHeader" data-tauri-drag-region>
				<div className="sidebarActions">
					<button
						type="button"
						className="sidebarToggleBtn"
						title={t("sidebar.collapse")}
						aria-label={t("sidebar.collapse")}
						onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
					>
						<SidebarToggleIcon size={16} />
					</button>
					<div className="sidebarNavHistoryGroup">
						<button
							type="button"
							className="sidebarNavHistoryBtn"
							onClick={onGoBack}
							disabled={!canGoBack}
							title={t("sidebar.goBack", { defaultValue: "Go back" })}
							aria-label={t("sidebar.goBack", { defaultValue: "Go back" })}
						>
							<NavArrowLeftIcon size={16} />
						</button>
						<button
							type="button"
							className="sidebarNavHistoryBtn"
							onClick={onGoForward}
							disabled={!canGoForward}
							title={t("sidebar.goForward", { defaultValue: "Go forward" })}
							aria-label={t("sidebar.goForward", { defaultValue: "Go forward" })}
						>
							<NavArrowRightIcon size={16} />
						</button>
					</div>
					<WindowChromeUpdateButton
						updateReady={autoUpdater.updateReady}
						updateVersion={autoUpdater.updateVersion}
						onInstallUpdate={autoUpdater.installAndRelaunch}
					/>
				</div>
			</div>
		</>
	);
}
