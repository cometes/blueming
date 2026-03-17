import { useState } from "react";
import type {
	SettingsGeneralSection,
	MainSettings,
	LibrarySettings,
	SettingsSnapshot,
} from "@/features/settings/types";
import type { GallerySettings } from "@/types/gallery";

export const useSettingsState = (initialSettings?: SettingsSnapshot | null) => {
	const [general, setGeneral] = useState<SettingsGeneralSection | undefined>(
		initialSettings?.general
	);
	const [main, setMain] = useState<MainSettings | undefined>(initialSettings?.main);
	const [library, setLibrary] = useState<LibrarySettings | undefined>(
		initialSettings?.library
	);
	const [gallery, setGallery] = useState<GallerySettings | undefined>(
		initialSettings?.gallery
	);
	const [loading, setLoading] = useState(!initialSettings);

	return {
		general,
		setGeneral,
		main,
		setMain,
		library,
		setLibrary,
		gallery,
		setGallery,
		loading,
		setLoading,
	};
};
