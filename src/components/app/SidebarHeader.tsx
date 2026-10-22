import { SidebarToggleIcon } from "@/components/Icons";
import { useTranslation } from "react-i18next";
import { useUILayoutContext, useUpdaterContext } from "../../contexts";
import { onWindowDragMouseDown } from "../../utils/window";
import { WindowChromeUpdateButton } from "./WindowChromeUpdateButton";

export function SidebarHeader() {
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
