import { getCurrentWebview } from "@tauri-apps/api/webview";
import { DURABLE_SETTINGS } from "./settings/definitions";

export const UI_ZOOM_LEVELS = [80, 90, 100, 110, 125, 150, 175, 200] as const;
export const DEFAULT_UI_ZOOM_LEVEL = 100;
export const MIN_UI_ZOOM_LEVEL = 80;
export const MAX_UI_ZOOM_LEVEL = 200;

export function getNextZoomLevel(current: number): number {
	for (const level of UI_ZOOM_LEVELS) {
		if (level > current) return level;
	}
	return MAX_UI_ZOOM_LEVEL;
}

export function getPreviousZoomLevel(current: number): number {
	for (let i = UI_ZOOM_LEVELS.length - 1; i >= 0; i--) {
		if (UI_ZOOM_LEVELS[i] < current) return UI_ZOOM_LEVELS[i];
	}
	return MIN_UI_ZOOM_LEVEL;
}

export async function applyWebviewZoom(zoomPercent: number): Promise<void> {
	try {
		const factor = Math.max(0.5, Math.min(3.0, zoomPercent / 100));
		await getCurrentWebview().setZoom(factor);
	} catch {
		// Ignored outside Tauri window context or during test execution
	}
}

let activeZoomLevel = DEFAULT_UI_ZOOM_LEVEL;

export function setActiveZoomLevel(level: number): void {
	activeZoomLevel = level;
}

export function getActiveZoomLevel(): number {
	return activeZoomLevel;
}

export async function zoomIn(): Promise<number> {
	const next = getNextZoomLevel(activeZoomLevel);
	activeZoomLevel = next;
	await applyWebviewZoom(next);
	await DURABLE_SETTINGS.zoomLevel.write(next);
	return next;
}

export async function zoomOut(): Promise<number> {
	const prev = getPreviousZoomLevel(activeZoomLevel);
	activeZoomLevel = prev;
	await applyWebviewZoom(prev);
	await DURABLE_SETTINGS.zoomLevel.write(prev);
	return prev;
}

export async function resetZoom(): Promise<number> {
	activeZoomLevel = DEFAULT_UI_ZOOM_LEVEL;
	await applyWebviewZoom(DEFAULT_UI_ZOOM_LEVEL);
	await DURABLE_SETTINGS.zoomLevel.write(DEFAULT_UI_ZOOM_LEVEL);
	return DEFAULT_UI_ZOOM_LEVEL;
}
