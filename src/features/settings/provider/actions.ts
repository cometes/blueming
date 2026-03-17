import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type {
	Design,
	GeneralSettings,
	LibrarySettings,
	MainSettings,
	Menu,
	SettingsGeneralSection,
} from "@/features/settings/types";
import type { GallerySettings } from "@/types/gallery";

interface CreateSettingsActionsArgs {
	setGeneral: Dispatch<SetStateAction<SettingsGeneralSection | undefined>>;
	setMain: Dispatch<SetStateAction<MainSettings | undefined>>;
	setLibrary: Dispatch<SetStateAction<LibrarySettings | undefined>>;
	setGallery: Dispatch<SetStateAction<GallerySettings | undefined>>;
}

export const useSettingsActions = ({
	setGeneral,
	setMain,
	setLibrary,
	setGallery,
}: CreateSettingsActionsArgs) => {
	const updateGeneral = useCallback((newSettings: Partial<GeneralSettings>) => {
		setGeneral((prev) =>
			prev
				? {
						...prev,
						...newSettings,
					}
				: (newSettings as SettingsGeneralSection)
		);
	}, [setGeneral]);

	const updateDesign = useCallback((newDesign: Design) => {
		setGeneral((prev) =>
			prev
				? {
						...prev,
						design: newDesign,
					}
				: prev
		);
	}, [setGeneral]);

	const updateMenu = useCallback((newMenu: Menu) => {
		setGeneral((prev) =>
			prev
				? {
						...prev,
						menu: newMenu,
					}
				: prev
		);
	}, [setGeneral]);

	const updateMain = useCallback((newSettings: Partial<MainSettings>) => {
		setMain((prev) => ({
			...(prev || {}),
			...newSettings,
		}));
	}, [setMain]);

	const updateLibrary = useCallback((newSettings: Partial<LibrarySettings>) => {
		setLibrary((prev) => ({
			...(prev || ({} as LibrarySettings)),
			...newSettings,
		}));
	}, [setLibrary]);

	const updateGallery = useCallback((newSettings: Partial<GallerySettings>) => {
		setGallery((prev) => ({
			...(prev || ({} as GallerySettings)),
			...newSettings,
		}));
	}, [setGallery]);

	return {
		updateGeneral,
		updateDesign,
		updateMenu,
		updateMain,
		updateLibrary,
		updateGallery,
	};
};
