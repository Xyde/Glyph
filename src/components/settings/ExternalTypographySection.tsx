import { useTranslation } from "react-i18next";
import type { UiFontFamily, UiFontSize } from "../../lib/settings";
import { FontSizeControl } from "./InterfaceTypographySection";
import { SettingsRow, SettingsSection } from "./SettingsScaffold";
import { SettingsSelect } from "./SettingsSelect";

interface ExternalTypographySectionProps {
	externalFontFamily: UiFontFamily;
	externalFontSize: UiFontSize;
	availableFonts: string[];
	onExternalFontFamilyChange: (font: UiFontFamily) => void;
	onExternalFontSizeChange: (size: UiFontSize) => void;
}

export function ExternalTypographySection({
	externalFontFamily,
	externalFontSize,
	availableFonts,
	onExternalFontFamilyChange,
	onExternalFontSizeChange,
}: ExternalTypographySectionProps) {
	const { t } = useTranslation("settings.typography");

	return (
		<SettingsSection title={t("externalNotes.title")}>
			<SettingsRow
				label={t("externalNotes.fontLabel")}
				htmlFor="settingsExternalFontFamily"
				description={t("externalNotes.fontDescription")}
				searchId="typography-external-font-family"
			>
				<SettingsSelect
					id="settingsExternalFontFamily"
					value={externalFontFamily}
					onChange={(event) => onExternalFontFamilyChange(event.target.value)}
				>
					{availableFonts.map((font) => (
						<option key={font} value={font}>
							{font}
						</option>
					))}
				</SettingsSelect>
			</SettingsRow>
			<FontSizeControl
				id="settingsExternalFontSize"
				searchId="typography-external-font-size"
				label={t("externalNotes.sizeLabel")}
				description={t("externalNotes.sizeDescription")}
				valueAriaLabel={t("externalNotes.valueAriaLabel")}
				value={externalFontSize}
				min={10}
				max={36}
				onChange={onExternalFontSizeChange}
			/>
		</SettingsSection>
	);
}
