// contexts/SettingsContext.tsx
"use client";

import { createContext, useContext } from "react";

// Layout Types
interface LayoutItem {
	i: string;
	x: number;
	y: number;
	w: number;
	h: number;
	maxW?: number;
	maxH?: number;
	moved?: boolean;
	static?: boolean;
}

interface WidgetItem {
	id: string;
	type: string;
	color: string;
}

interface CustomLayout {
	layout: LayoutItem[];
	mobileLayout?: LayoutItem[];
	widgets: WidgetItem[];
	usedColors: string[];
}


// Slide Types
interface SlideItem {
	id: string;
	uniqueId: string;
	url: string;
	image: string;
	target: boolean;
}

// Notice Types
interface MarqueeSettings {
	backgroundColor: string;
	gradientColor: string;
	gradientWidth: number;
	type: string;
	textColor: string;
	marqueeType: string;
}

interface EditorDimensions {
	width: number;
	height: number;
}

interface Notice {
	noticeContent: string;
	editorDimensions: EditorDimensions;
	marqueeSettings: MarqueeSettings;
	bannerText: string;
}

// D-Day Types
interface DdayItem {
	id: string;
	uniqueId: string;
	title: string;
	date: string;
	image: string;
	target: boolean;
}

// Profile Types
interface Profile {
	profileImage: string;
	etc: string;
	nickname: string;
	introduction: string;
	headerImage: string;
}

// Menu Types
interface SubMenu {
	name: string;
	image: string;
}

interface MenuItem {
	id: string;
	uniqueId: string;
	allow: string;
	image: string;
	target: boolean;
	name: string;
	type: string;
	isPublic: boolean;
	openInNewTab: boolean;
	category: string;
	subMenus?: (string | SubMenu)[];
	url?: string;
}

interface MenuDesign {
	fontColor: string;
	textAlign: string;
	type: string;
	align: string;
	logoText: string;
	logoImage: string;
	logoType: string;
	backgroundColor: string;
	bgType: string;
	backgroundImage: string;
}

interface Menu {
	menus: MenuItem[];
	design: MenuDesign;
}

// Design Types
interface WidgetDesign {
	borderImage: string;
	borderRadius: number;
	borderColor: string;
	background: string;
	borderWidth: number;
	blur: number;
	borderStyle: string;
}

interface FontDesign {
	bodyFontFamily: string;
	subFontColor: string;
	mainFontColor: string;
	titleFontFamily: string;
}

interface CardDesign {
	boxShadow: string;
	borderRadius: number;
	translateY: number;
	borderWidth: number;
	borderStyle: string;
	blur: number;
	borderColor: string;
	background: string;
	type: string;
	borderActiveColor: string;
}

interface BackgroundDesign {
	image: string;
	color: string;
	type: string;
}

interface EffectSettings {
	enabled: boolean;
	type: "없음" | "눈" | "비" | "별똥별" | "밤하늘" | "프리즘" | "반딧불이" | "수중" | "빗물창문" | "영화관";
}

interface Design {
	widget: WidgetDesign;
	font: FontDesign;
	card: CardDesign;
	background: BackgroundDesign;
	effect?: EffectSettings;
}

// General Types
interface General {
	desc: string;
	favicon: string;
	shareImage: string;
	secondaryColor: string;
	primaryColor: string;
	title: string;
	logoImage: string;
	logoText: string;
	logoType: string;
}

// Theme Types
interface ThemeItem {
	id: string;
	name: string;
	createdAt: string;
	general: {
		general: General;
		design: Design;
		menu: Menu;
	};
	main: MainSettings;
	exportedAt: string;
	version: string;
}

// Main Settings
interface MainSettings {
	customLayout?: CustomLayout;
	slide?: SlideItem[];
	notice?: Notice;
	dday?: DdayItem[];
	profile?: Profile;
}

// Root Settings Context
interface GeneralSettings {
	theme?: ThemeItem[];
	general?: General;
	menu?: Menu;
	design?: Design;
}

interface SettingsContextType {
	general?: {
		theme: ThemeItem[];
		general: General;
		menu: Menu;
		design: Design;
	};
	main?: MainSettings;
	updateGeneral?: (general: Partial<GeneralSettings>) => void;
	updateDesign?: (design: Design) => void;
	updateMenu?: (menu: Menu) => void;
	updateMain?: (main: Partial<MainSettings>) => void;
}

// Context 생성
export const SettingsContext = createContext<SettingsContextType | undefined>(
	undefined
);

// Hook
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
	CustomLayout,
	LayoutItem,
	WidgetItem,
	SlideItem,
	Notice,
	DdayItem,
	Profile,
	MenuItem,
	SubMenu,
	MenuDesign,
	Menu,
	Design,
	General,
	ThemeItem,
	EffectSettings,
};
