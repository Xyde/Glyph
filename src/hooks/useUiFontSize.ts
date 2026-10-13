import { useQuery, useQueryClient } from "@tanstack/react-query";
import { loadSettings } from "../lib/settings";
import { useTauriEvent } from "../lib/tauriEvents";

const DEFAULT_UI_FONT_SIZE = 14;

export function useUiFontSize(): number {
	const queryClient = useQueryClient();
	const { data: fontSize = DEFAULT_UI_FONT_SIZE } = useQuery({
		queryKey: ["settings", "ui", "fontSize"],
		queryFn: async () => (await loadSettings()).ui.fontSize,
		staleTime: Number.POSITIVE_INFINITY,
	});

	useTauriEvent("settings:updated", (payload) => {
		if (typeof payload.ui?.fontSize === "number" && Number.isFinite(payload.ui.fontSize)) {
			queryClient.setQueryData(["settings", "ui", "fontSize"], payload.ui.fontSize);
		}
	});

	return fontSize;
}
