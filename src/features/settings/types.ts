import type { StickerBoardSettings } from "@/features/stickerboard-editor/model";
import type { GallerySettings } from "@/features/gallery/types";

export interface LayoutItem {
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

export interface WidgetItem {
	id: string;
	type: string;
	color: string;
}

export interface CustomLayout {
	layout: LayoutItem[];
	mobileLayout?: LayoutItem[];
	desktopWidgets: WidgetItem[];
	mobileWidgets: WidgetItem[];
	desktopUsedColors: string[];
	mobileUsedColors: string[];
}

export interface SlideItem {
	id: string;
	uniqueId: string;
	url: string;
	image: string;
	target: boolean;
}

export interface MarqueeSettings {
	backgroundColor: string;
	gradientColor: string;
	gradientWidth: number;
	type: string;
	textColor: string;
	marqueeType: string;
}

export interface EditorDimensions {
	width: number;
	height: number;
}

export interface Notice {
	noticeContent: string;
	editorDimensions: EditorDimensions;
	marqueeSettings: MarqueeSettings;
	bannerText: string;
}

export interface DdayItem {
	id: string;
	uniqueId: string;
	title: string;
	date: string;
	image: string;
	target: string;
}

export interface Profile {
	profileImage: string;
	etc: string;
	nickname: string;
	introduction: string;
	headerImage: string;
}

export type ProfileData = Profile;
export type DdayData = DdayItem;
export type SlideData = SlideItem;

export interface ImageWidgetSettings {
	images: string[];
	fits?: Array<"cover" | "contain">;
}

export interface WeatherClockSettings {
	enabled: boolean;
	city: string;
	backgroundImage?: string;
	backgroundImageCity?: string;
}

export interface SubMenu {
	name: string;
	image: string;
}

export interface MenuItem {
	id: string;
	uniqueId: string;
	allow: string;
	image: string;
	iconImage?: string;
	target: boolean;
	name: string;
	type: string;
	isPublic: boolean;
	openInNewTab: boolean;
	category: string;
	subMenus?: Array<string | SubMenu>;
	url?: string;
}

export interface MenuDesign {
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
	iconBarLogoImage?: string;
	iconBarLogoType?: string;
	iconBarBgType?: string;
	iconBarBackgroundColor?: string;
	iconBarBackgroundImage?: string;
}

export interface Menu {
	menus?: MenuItem[];
	design?: Partial<MenuDesign>;
}

export interface WidgetDesign {
	borderImage?: string;
	borderImageType?: "full" | "corner";
	borderRadius?: number;
	borderColor?: string;
	background?: string;
	borderWidth?: number;
	blur?: number;
	borderStyle?: string;
}

export interface FontDesign {
	bodyFontFamily?: string;
	subFontColor?: string;
	mainFontColor?: string;
	titleFontFamily?: string;
}

export interface FontRegistryItem {
	id?: string;
	name?: string;
	family?: string;
	source?: "url" | "file";
	url?: string;
}

export interface CardDesign {
	boxShadow?: string;
	borderRadius?: number;
	translateY?: number;
	borderWidth?: number;
	borderStyle?: string;
	blur?: number;
	borderColor?: string;
	background?: string;
	type?: string;
	borderActiveColor?: string;
}

export interface BackgroundDesign {
	image?: string;
	color?: string;
	type?: string;
}

export interface EffectSettings {
	enabled: boolean;
	type:
		| "없음"
		| "눈"
		| "비"
		| "별똥별"
		| "밤하늘"
		| "프리즘"
		| "반딧불이"
		| "비눗방울"
		| "빗물창문"
		| "영화관";
}

export interface Design {
	widget: WidgetDesign;
	font: FontDesign;
	card: CardDesign;
	background: BackgroundDesign;
	effect?: EffectSettings;
}

export interface General {
	desc: string;
	favicon: string;
	shareImage: string;
	secondaryColor: string;
	primaryColor: string;
	title: string;
	logoImage: string;
	logoText: string;
	logoType: string;
	logoFontFamily?: string;
	logoFontWeight?: string;
	logoColor?: string;
}

export interface PhotoboardSettings {
	postsPerRow?: number;
	writePermission?: "admin" | "manager" | "member";
}

export interface MemoSettings {
	postsPerRow?: number;
	writePermission?: "admin" | "manager" | "member";
	/** 답글 권한: author = 메모 작성자만(기본), member = 활성 회원 누구나 */
	replyPermission?: "author" | "member";
}

export interface MusicPlayerItem {
	id: string;
	title: string;
	videoId?: string;
	playlistId?: string;
	thumbnail?: string;
	artist?: string;
	/** 구 형식 항목의 원본 URL (videoId/playlistId 미보유 시 파생용) */
	url?: string;
}

export interface MusicPlayerSettings {
	enabled: boolean;
	items: MusicPlayerItem[];
	defaultItemId?: string;
	/** 방문자 초기 볼륨(0~100). 방문자가 직접 조절하면 그 값이 우선 */
	defaultVolume?: number;
}

/** 디데이 위젯에서 여러 디데이를 보여주는 방식 */
export type DdayDisplayMode = "grid" | "fade" | "slide";

export interface MainSettings {
	customLayout?: CustomLayout;
	slide?: SlideItem[];
	notice?: Notice;
	dday?: DdayItem[];
	ddayDisplayMode?: DdayDisplayMode;
	profile?: Profile;
	stickerBoard?: StickerBoardSettings;
	imageWidget?: ImageWidgetSettings;
	weatherClock?: WeatherClockSettings;
	photoboard?: PhotoboardSettings;
	memo?: MemoSettings;
	musicPlayer?: MusicPlayerSettings;
}

export interface LibrarySettings {
	layoutType: "list" | "listWithImage";
	postsPerPage: number;
	postsPerRow: number;
	writePermission: "admin" | "manager" | "member";
}

export interface ThemeItem {
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

export interface GeneralSettings {
	theme?: ThemeItem[];
	general?: Partial<General>;
	menu?: Partial<Menu>;
	design?: Partial<Design>;
	fontRegistry?: FontRegistryItem[];
}

export interface SettingsGeneralSection {
	theme?: ThemeItem[];
	general?: Partial<General>;
	menu?: Partial<Menu>;
	design?: Partial<Design>;
	fontRegistry?: FontRegistryItem[];
}

export interface SettingsSnapshot {
	general?: SettingsGeneralSection;
	main?: MainSettings;
	library?: LibrarySettings;
	gallery?: GallerySettings;
}

export interface SettingsRefreshOptions {
	broadcast?: boolean;
	noCache?: boolean;
}

export interface SettingsContextType extends SettingsSnapshot {
	updateGeneral?: (general: Partial<GeneralSettings>) => void;
	updateDesign?: (design: Design) => void;
	updateMenu?: (menu: Menu) => void;
	updateMain?: (main: Partial<MainSettings>) => void;
	updateLibrary?: (library: Partial<LibrarySettings>) => void;
	updateGallery?: (gallery: Partial<GallerySettings>) => void;
	refreshSettings?: (options?: SettingsRefreshOptions) => Promise<void>;
	loading?: boolean;
}
