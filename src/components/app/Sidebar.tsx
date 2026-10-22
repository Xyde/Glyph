import { cn } from "@/lib/utils";
import { Settings } from "@/components/Icons";
import { m, useReducedMotion } from "motion/react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useUILayoutContext } from "../../contexts";
import type { SpaceDefinition } from "../../lib/spaceRegistry";
import { SidebarContent, type SidebarContentProps } from "./SidebarContent";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarSettingsContent } from "./SidebarSettingsContent";
import { SpaceSwitcher } from "./SpaceSwitcher";

interface SidebarProps extends SidebarContentProps {
	sidebarCollapsed: boolean;
	spaces: SpaceDefinition[];
	activeSpacePath: string | null;
	switchingSpacePath: string | null;
	onSelectSpace: (path: string) => Promise<boolean>;
	onSetSpaceIcon: (path: string, iconName: string | null) => Promise<void>;
	onCloseSpace: (path: string) => Promise<void>;
	canGoBack?: boolean;
	canGoForward?: boolean;
	onGoBack?: () => void;
	onGoForward?: () => void;
}

export const Sidebar = memo(function Sidebar({
	sidebarCollapsed,
	spaces,
	activeSpacePath,
	switchingSpacePath,
	onSelectSpace,
	onSetSpaceIcon,
	onCloseSpace,
	canGoBack,
	canGoForward,
	onGoBack,
	onGoForward,
	...contentProps
}: SidebarProps) {
	const { sidebarWidth, settingsMode, openSettings } = useUILayoutContext();
	const { t } = useTranslation("shell");
	const shouldReduceMotion = useReducedMotion();
	const sidebarState = sidebarCollapsed ? "collapsed" : "expanded";
	const spaceSwitcher = (
		<SpaceSwitcher
			spaces={spaces}
			activeSpacePath={activeSpacePath}
			switchingSpacePath={switchingSpacePath}
			onSelectSpace={onSelectSpace}
			onSetSpaceIcon={onSetSpaceIcon}
			onCloseSpace={onCloseSpace}
		/>
	);

	return (
		<m.aside
			data-slot="sidebar"
			data-sidebar="sidebar"
			data-state={sidebarState}
			data-collapsible={sidebarCollapsed ? "offcanvas" : ""}
			className={cn("sidebar", sidebarCollapsed && "sidebarCollapsed")}
			style={{ width: sidebarCollapsed ? 0 : sidebarWidth }}
			animate={{ width: sidebarCollapsed ? 0 : sidebarWidth }}
			transition={
				shouldReduceMotion
					? { type: "tween", duration: 0 }
					: { type: "spring", stiffness: 400, damping: 30 }
			}
		>
			{!sidebarCollapsed && (
				<div
					data-slot="sidebar-inner"
					className="sidebarContentRoot"
				>
					{settingsMode ? (
						<>
							<div aria-hidden="true" className="sidebarDragLayer" data-tauri-drag-region />
							<div className="sidebarHeader" data-tauri-drag-region />
							<SidebarSettingsContent />
						</>
					) : (
						<>
							<SidebarHeader
								canGoBack={canGoBack}
								canGoForward={canGoForward}
								onGoBack={onGoBack}
								onGoForward={onGoForward}
							/>
							<SidebarContent key={activeSpacePath ?? "no-space"} {...contentProps} />
							<div className="sidebarFooter">
								<button
									type="button"
									className="sidebarFooterBtn sidebarSettingsBtn"
									onClick={() => openSettings()}
									aria-label={t("sidebar.settings", { defaultValue: "Settings" })}
									title={`${t("sidebar.settings", { defaultValue: "Settings" })} (⌘,)`}
								>
									<Settings size={16} />
									<span className="sidebarFooterLabel">
										{t("sidebar.settings", { defaultValue: "Settings" })}
									</span>
								</button>
								<div className="sidebarBottomLayer">{spaceSwitcher}</div>
							</div>
						</>
					)}
				</div>
			)}
		</m.aside>
	);
});
