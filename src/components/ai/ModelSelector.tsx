import { useQuery } from "@tanstack/react-query";
import type { AiModel, AiProviderKind } from "../../lib/tauri";
import { invoke } from "../../lib/tauri";
import { ChevronDown } from "../Icons";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "../ui/shadcn/dropdown-menu";
import styles from "./ModelSelector.module.css";
import { ProviderLogo, providerLogoMap, resolveLogoProvider } from "./modelSelectorConstants";

interface ModelSelectorProps {
	profileId: string | null;
	value: string;
	onChange: (modelId: string) => void;
	provider: AiProviderKind | null;
}

export function ModelSelector({ profileId, value, onChange, provider }: ModelSelectorProps) {
	const modelsQuery = useQuery({
		queryKey: ["ai", "models", profileId, provider],
		queryFn: () => {
			if (!profileId) return Promise.resolve<AiModel[]>([]);
			return invoke("ai_models_list", { profile_id: profileId, provider });
		},
		enabled: Boolean(profileId),
		staleTime: 60_000,
	});

	const selectedModel = modelsQuery.data?.find((model) => model.id === value);
	const displayLabel = selectedModel?.name || value || "Model";
	const logoProvider = resolveLogoProvider(provider, selectedModel?.name);
	const providerTitle = logoProvider
		? (providerLogoMap[logoProvider]?.label ?? logoProvider)
		: "Model provider";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button
						type="button"
						className={styles.trigger}
						title={value || "Select model"}
						aria-label="Select model"
						disabled={!profileId || (modelsQuery.isFetching && !modelsQuery.data?.length)}
					/>
				}
			>
				{logoProvider && (
					<span className={styles.triggerLogo} title={providerTitle}>
						<ProviderLogo provider={logoProvider} className={styles.providerSvg} />
					</span>
				)}
				<span className={styles.triggerLabel}>{displayLabel}</span>
				<span className={styles.triggerIcon}>
					<ChevronDown size="var(--icon-sm)" />
				</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				side="top"
				align="end"
				sideOffset={6}
				className="max-h-[300px] w-64 overflow-y-auto"
			>
				{modelsQuery.isLoading ? (
					<div className="p-2 text-xs text-muted-foreground">Loading models...</div>
				) : modelsQuery.isError ? (
					<div className="p-2 text-xs text-destructive">Could not load models</div>
				) : !modelsQuery.data?.length ? (
					<div className="p-2 text-xs text-muted-foreground">No models available</div>
				) : (
					<DropdownMenuRadioGroup
						value={value}
						onValueChange={(val) => {
							if (typeof val === "string") {
								onChange(val);
							}
						}}
					>
						{modelsQuery.data.map((model) => (
							<DropdownMenuRadioItem key={model.id} value={model.id} closeOnClick>
								<span className="truncate" title={model.name}>
									{model.name}
								</span>
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
