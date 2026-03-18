"use client";

import { createContext, useContext } from "react";
import type { SettingsContextType } from "@/features/settings/types";

export const SettingsContext = createContext<SettingsContextType | undefined>(
	undefined
);

export const useSettings = (): SettingsContextType => {
	const context = useContext(SettingsContext);

	if (!context) {
		throw new Error("useSettings must be used within a SettingsProvider");
	}

	return context;
};

export type {
	SettingsContextType,
	MainSettings,
	LibrarySettings,
	CustomLayout,
	LayoutItem,
	WidgetItem,
	SlideItem,
	Notice,
	DdayItem,
	Profile,
	ImageWidgetSettings,
	WeatherClockSettings,
	PhotoboardSettings,
	MemoSettings,
	MenuItem,
	SubMenu,
	MenuDesign,
	Menu,
	Design,
	General,
	FontRegistryItem,
	ThemeItem,
	EffectSettings,
	GeneralSettings,
	SettingsSnapshot,
} from "@/features/settings/types";
export type { StickerBoardSettings } from "@/features/stickerboard-editor/model";
export type { GallerySettings } from "@/features/gallery/types";
