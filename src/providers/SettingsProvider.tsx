"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { SettingsContext } from "@/contexts/SettingsContext";
import type { SettingsSnapshot } from "@/features/settings/types";
import { useSettingsActions } from "@/features/settings/provider/actions";
import { useSettingsState } from "@/features/settings/provider/state";
import { useSettingsSync } from "@/features/settings/provider/sync";

export function SettingsProvider({
	children,
	initialSettings,
}: {
	children: ReactNode;
	initialSettings?: SettingsSnapshot | null;
}) {
	const {
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
	} = useSettingsState(initialSettings);

	const {
		updateGeneral,
		updateDesign,
		updateMenu,
		updateMain,
		updateLibrary,
		updateGallery,
	} = useSettingsActions({
		setGeneral,
		setMain,
		setLibrary,
		setGallery,
	});

	const { refreshSettings } = useSettingsSync({
		initialSettings,
		setGeneral,
		setMain,
		setLibrary,
		setGallery,
		setLoading,
	});

	const value = useMemo(
		() => ({
			general,
			main,
			library,
			gallery,
			updateGeneral,
			updateDesign,
			updateMenu,
			updateMain,
			updateLibrary,
			updateGallery,
			refreshSettings,
			loading,
		}),
		[
			general,
			main,
			library,
			gallery,
			loading,
			refreshSettings,
			updateGeneral,
			updateDesign,
			updateMenu,
			updateMain,
			updateLibrary,
			updateGallery,
		]
	);

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
}
