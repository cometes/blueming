import type { MenuDesign, MenuItem } from "@/features/settings/types";

export type OpenFolders = Record<string, boolean>;

export type BoardRoutes = Record<string, string>;

export interface MenuData {
	design: Partial<MenuDesign>;
	menus: MenuItem[];
}
