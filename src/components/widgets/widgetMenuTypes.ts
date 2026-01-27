export interface MenuItem {
	uniqueId: string;
	category: string;
	name: string;
	image?: string;
	iconImage?: string;
	url?: string;
	isPublic?: boolean;
	allow?: string;
	subMenus?: (string | { name: string; image?: string })[];
}

export interface MenuDesign {
	textAlign?: string;
	bgType?: string;
	backgroundColor?: string;
	backgroundImage?: string;
	logoType?: string;
	logoImage?: string;
	fontColor?: string;
	iconBarLogoType?: string;
	iconBarBgType?: string;
	iconBarLogoImage?: string;
	iconBarBackgroundColor?: string;
	iconBarBackgroundImage?: string;
}

export interface MenuData {
	design: MenuDesign;
	menus: MenuItem[];
}

export interface OpenFolders {
	[key: string]: boolean;
}

export type BoardRoutes = {
	[key: string]: string;
};
