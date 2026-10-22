import { useCallback, useRef, useState } from "react";
import glyphIconUrl from "../../../src-tauri/icons/icon.png";
import { AppearanceIcon } from "../AppearanceIcon";
import { GlyphBloom } from "../easter-eggs/glyph-bloom/GlyphBloom";
import type { SpaceDefinition } from "../../lib/spaceRegistry";

interface WelcomeScreenProps {
	onOpenSpace: () => Promise<void> | void;
	onCreateSpace?: () => Promise<void> | void;
	spaces?: SpaceDefinition[];
	onSelectSpace?: (path: string) => Promise<boolean> | void;
}

export function WelcomeScreen({
	onOpenSpace,
	onCreateSpace,
	spaces = [],
	onSelectSpace,
}: WelcomeScreenProps) {
	const [isOpening, setIsOpening] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const isActionRef = useRef(false);

	const handleOpen = useCallback(async () => {
		if (isActionRef.current) return;
		isActionRef.current = true;
		setIsOpening(true);
		try {
			await onOpenSpace();
		} catch (error) {
			console.error("Failed to open space", error);
		} finally {
			isActionRef.current = false;
			setIsOpening(false);
		}
	}, [onOpenSpace]);

	const handleCreate = useCallback(async () => {
		if (isActionRef.current || !onCreateSpace) return;
		isActionRef.current = true;
		setIsCreating(true);
		try {
			await onCreateSpace();
		} catch (error) {
			console.error("Failed to create space", error);
		} finally {
			isActionRef.current = false;
			setIsCreating(false);
		}
	}, [onCreateSpace]);

	const isBusy = isOpening || isCreating;

	return (
		<div className="welcomeScreen">
			<div className="welcomeScreenBody">
				<GlyphBloom iconUrl={glyphIconUrl} />
				<h1 className="welcomeScreenTitle">
					Glyph
					<span className="welcomeScreenTitleSub">Write. Reflect. Discover.</span>
				</h1>
				<p className="welcomeScreenSub">
					Open your current notes folder or create a new workspace.
				</p>
				<div
					style={{
						display: "flex",
						gap: "12px",
						justifyContent: "center",
						marginBottom: "24px",
					}}
				>
					<button
						type="button"
						className="welcomeScreenBtn"
						onClick={handleOpen}
						disabled={isBusy}
						aria-busy={isOpening}
					>
						{isOpening ? "Opening..." : "Open Vault"}
					</button>
					{onCreateSpace ? (
						<button
							type="button"
							className="welcomeScreenBtn"
							onClick={handleCreate}
							disabled={isBusy}
							aria-busy={isCreating}
						>
							{isCreating ? "Creating..." : "New Vault"}
						</button>
					) : null}
				</div>

				{spaces && spaces.length > 0 ? (
					<div
						style={{
							marginTop: "20px",
							textAlign: "left",
							background: "var(--bg-secondary)",
							borderRadius: "var(--radius-lg)",
							border: "1px solid var(--border-primary)",
							padding: "16px",
							maxHeight: "220px",
							overflowY: "auto",
						}}
					>
						<div
							style={{
								fontSize: "calc(var(--text-base) * 0.8)",
								fontWeight: 600,
								color: "var(--text-tertiary)",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
								marginBottom: "10px",
							}}
						>
							Recent Vaults
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
							{spaces.map((s) => (
								<button
									key={s.path}
									type="button"
									onClick={() => void onSelectSpace?.(s.path)}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "10px",
										padding: "8px 12px",
										borderRadius: "var(--radius-md)",
										background: "transparent",
										border: "none",
										color: "var(--text-primary)",
										cursor: "pointer",
										textAlign: "left",
										width: "100%",
									}}
									className="welcomeRecentVaultItem"
								>
									<AppearanceIcon iconName={s.iconName} size="var(--icon-md)" />
									<div style={{ minWidth: 0, flex: 1 }}>
										<div
											style={{
												fontWeight: 500,
												fontSize: "calc(var(--text-base) * 0.9)",
											}}
										>
											{s.name}
										</div>
										<div
											style={{
												fontSize: "calc(var(--text-base) * 0.75)",
												color: "var(--text-tertiary)",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											{s.path}
										</div>
									</div>
								</button>
							))}
						</div>
					</div>
				) : null}

				<p className="welcomeScreenKicker">Plain Markdown. Local files.</p>
			</div>
		</div>
	);
}
