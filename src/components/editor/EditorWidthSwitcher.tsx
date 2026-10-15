import { useCallback } from "react";
import { useEditorWidthMode } from "../../hooks/useEditorWidthMode";
import { DURABLE_SETTINGS, type EditorWidthMode } from "../../lib/settings";

const CYCLE_ORDER: readonly EditorWidthMode[] = [
	"ratio-1-3",
	"ratio-1-2",
	"ratio-2-3",
	"ratio-3-4",
];

const RATIO_LABELS: Record<EditorWidthMode, string> = {
	"ratio-1-3": "1/3",
	"ratio-1-2": "1/2",
	"ratio-2-3": "2/3",
	"ratio-3-4": "3/4",
	compact: "720",
	comfortable: "860",
	wide: "Max",
};

export function EditorWidthSwitcher() {
	const currentMode = useEditorWidthMode();

	const handleCycle = useCallback(async () => {
		const currentIndex = CYCLE_ORDER.indexOf(currentMode);
		const nextIndex = currentIndex === -1 ? 1 : (currentIndex + 1) % CYCLE_ORDER.length;
		const nextMode = CYCLE_ORDER[nextIndex] ?? "ratio-1-2";
		await DURABLE_SETTINGS.editorWidthMode.write(nextMode);
	}, [currentMode]);

	const label = RATIO_LABELS[currentMode] ?? "1/2";

	return (
		<button
			type="button"
			className="markdownEditorToolbarBtn markdownEditorWidthBtn"
			onClick={() => void handleCycle()}
			title={`Editor Width: ${label} (Click to cycle 1/3, 1/2, 2/3, 3/4)`}
			aria-label={`Editor Width: ${label}`}
		>
			{label}
		</button>
	);
}
