import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { memo, Suspense, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUILayoutContext } from "../../contexts";
import { cn } from "../../lib/utils";
import { SidebarSettingsContent } from "../app/SidebarSettingsContent";
import { HugeiconsIcon } from "../HugeiconsIcon";
import { SettingsTabContent } from "./SettingsTabContent";
import { localizedSettingsTabLabel } from "./settingsSearch";
import { useActiveSettingsTab } from "./useDeveloperMode";

interface SettingsModalProps {
	open: boolean;
	onClose: () => void;
}

function ExpandModalIcon({
	size = 15,
	className,
	...props
}: {
	size?: number | string;
	className?: string;
} & React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.3"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
			{...props}
		>
			<path d="M10 2h4v4M6 14H2v-4M14 2L9.5 6.5M2 14l4.5-4.5" vectorEffect="non-scaling-stroke" />
		</svg>
	);
}

function MinimizeModalIcon({
	size = 15,
	className,
	...props
}: {
	size?: number | string;
	className?: string;
} & React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.3"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
			{...props}
		>
			<path d="M14 6h-4V2M2 10h4v4M10 6l4.5-4.5M6 10l-4.5 4.5" vectorEffect="non-scaling-stroke" />
		</svg>
	);
}

export const SettingsModal = memo(function SettingsModal({
	open,
	onClose,
}: SettingsModalProps) {
	const { t, i18n } = useTranslation(["shell", "settings.general"]);
	const settingsTab = useActiveSettingsTab();
	const [isExpanded, setIsExpanded] = useState(false);

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) onClose();
		},
		[onClose],
	);

	const toggleExpanded = useCallback(() => {
		setIsExpanded((prev) => !prev);
	}, []);

	const tabTitle = localizedSettingsTabLabel(settingsTab, i18n.language);

	return (
		<DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Backdrop className="settingsModalBackdrop" />
				<DialogPrimitive.Popup
					className={cn("settingsModalPopup", isExpanded && "is-expanded")}
					aria-label={t("sidebar.settings", { defaultValue: "Settings" })}
				>
					<aside className="settingsModalSidebar">
						<SidebarSettingsContent showBackButton={false} />
					</aside>

					<main className="settingsModalMain">
						<header className="settingsModalHeader" onDoubleClick={toggleExpanded}>
							<h2 className="settingsPanelTitle">{tabTitle}</h2>
							<div className="settingsModalActions">
								<button
									type="button"
									className="settingsModalActionBtn"
									onClick={toggleExpanded}
									title={
										isExpanded
											? t("settings.restoreModal", { defaultValue: "Restore modal size" })
											: t("settings.expandModal", { defaultValue: "Expand modal" })
									}
									aria-label={isExpanded ? "Restore modal size" : "Expand modal"}
								>
									{isExpanded ? <MinimizeModalIcon size={15} /> : <ExpandModalIcon size={15} />}
								</button>
								<button
									type="button"
									className="settingsModalActionBtn settingsModalCloseBtn"
									onClick={onClose}
									title={t("settings.close", { defaultValue: "Close settings (Esc)" })}
									aria-label={t("settings.close", { defaultValue: "Close settings" })}
								>
									<HugeiconsIcon icon={Cancel01Icon} size={15} />
								</button>
							</div>
						</header>

						<div className="settingsModalBody">
							<Suspense fallback={null}>
								<SettingsTabContent tab={settingsTab} />
							</Suspense>
						</div>
					</main>
				</DialogPrimitive.Popup>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
});
