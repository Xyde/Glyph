import { isTauri } from "@tauri-apps/api/core";
import { LogicalPosition } from "@tauri-apps/api/dpi";
import { Menu, type MenuOptions } from "@tauri-apps/api/menu";

type TauriMenuItem = NonNullable<MenuOptions["items"]>[number];

interface NativeContextMenuBaseItem {
	label: string;
	enabled?: boolean;
}

interface NativeContextMenuActionItem extends NativeContextMenuBaseItem {
	type?: "item";
	checked?: boolean;
	action: () => void;
}

interface NativeContextMenuSubmenuItem extends NativeContextMenuBaseItem {
	type: "submenu";
	items: NativeContextMenuItem[];
}

interface NativeContextMenuSeparatorItem {
	type: "separator";
}

export type NativeContextMenuItem =
	| NativeContextMenuActionItem
	| NativeContextMenuSubmenuItem
	| NativeContextMenuSeparatorItem;

interface NativeContextMenuEvent {
	clientX?: number;
	clientY?: number;
	preventDefault: () => void;
	stopPropagation: () => void;
}

interface NativePopupMenuEvent {
	currentTarget?: Element;
	clientX?: number;
	clientY?: number;
	preventDefault: () => void;
	stopPropagation: () => void;
}

interface NativeMenuResult {
	shown: boolean;
	didSelectItem: boolean;
}

function nativeMenuText(label: string): string {
	return label.replace(/&/g, "&&");
}

function buildTauriMenuItems(
	items: NativeContextMenuItem[],
	onAction: () => void,
): TauriMenuItem[] {
	return items.map((item): TauriMenuItem => {
		if (item.type === "separator") {
			return { item: "Separator" };
		}

		if (item.type === "submenu") {
			return {
				text: nativeMenuText(item.label),
				enabled: item.enabled ?? item.items.length > 0,
				items: buildTauriMenuItems(item.items, onAction),
			};
		}

		const action = () => {
			onAction();
			item.action();
		};

		if (item.checked !== undefined) {
			return {
				text: nativeMenuText(item.label),
				enabled: item.enabled ?? true,
				checked: item.checked,
				action,
			};
		}

		return {
			text: nativeMenuText(item.label),
			enabled: item.enabled ?? true,
			action,
		};
	});
}

export function isNativeContextMenuAvailable(): boolean {
	return isTauri();
}

async function showNativeMenu(
	event: { preventDefault: () => void; stopPropagation: () => void },
	items: NativeContextMenuItem[],
	position?: LogicalPosition,
): Promise<NativeMenuResult> {
	if (!isTauri()) return { shown: false, didSelectItem: false };

	event.preventDefault();
	event.stopPropagation();

	let didSelectItem = false;
	const menu = await Menu.new({
		items: buildTauriMenuItems(items, () => {
			didSelectItem = true;
		}),
	});

	try {
		if (position) {
			await menu.popup(position);
		} else {
			await menu.popup();
		}
		return { shown: true, didSelectItem };
	} finally {
		await menu.close().catch((error: unknown) => {
			console.error("Failed to close native context menu", error);
		});
	}
}

export async function showNativeContextMenu(
	event: NativeContextMenuEvent,
	items: NativeContextMenuItem[],
): Promise<boolean> {
	const position =
		typeof event.clientX === "number" && typeof event.clientY === "number"
			? new LogicalPosition(event.clientX, event.clientY)
			: undefined;
	const result = await showNativeMenu(event, items, position);
	return result.didSelectItem;
}

export interface NativePopupMenuOptions {
	placement?: "bottom-start" | "right-end" | "right-start";
}

export async function showNativePopupMenu(
	event: NativePopupMenuEvent,
	items: NativeContextMenuItem[],
	options?: NativePopupMenuOptions,
): Promise<boolean> {
	let position: LogicalPosition | undefined;
	if (event.currentTarget instanceof Element) {
		const rect = event.currentTarget.getBoundingClientRect();
		if (options?.placement === "right-end") {
			position = new LogicalPosition(Math.round(rect.right + 4), Math.round(rect.bottom));
		} else if (options?.placement === "right-start") {
			position = new LogicalPosition(Math.round(rect.right + 4), Math.round(rect.top));
		} else {
			position = new LogicalPosition(Math.round(rect.left), Math.round(rect.bottom));
		}
	}
	const result = await showNativeMenu(event, items, position);
	return result.didSelectItem;
}
