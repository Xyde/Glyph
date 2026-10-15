import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type EditorWidthMode, isEditorWidthMode, loadSettings } from "../lib/settings";
import { useTauriEvent } from "../lib/tauriEvents";

const DEFAULT_EDITOR_WIDTH_MODE: EditorWidthMode = "compact";

export function useEditorWidthMode(): EditorWidthMode {
	const queryClient = useQueryClient();
	const { data: mode = DEFAULT_EDITOR_WIDTH_MODE } = useQuery({
		queryKey: ["settings", "editor", "editorWidthMode"],
		queryFn: async () => (await loadSettings()).editor.editorWidthMode,
		staleTime: Number.POSITIVE_INFINITY,
	});

	useTauriEvent("settings:updated", (payload) => {
		if (isEditorWidthMode(payload.editor?.editorWidthMode)) {
			queryClient.setQueryData(
				["settings", "editor", "editorWidthMode"],
				payload.editor.editorWidthMode,
			);
		}
	});

	return mode;
}
