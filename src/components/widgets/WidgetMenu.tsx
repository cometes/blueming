/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";
import { useState, useMemo, useCallback } from "react";
import { useAdmin } from "@/hooks/auth/UseAdmin";
import type {
	BoardRoutes,
	MenuData,
	MenuDesign,
	MenuItem,
	OpenFolders,
} from "./widgetMenuTypes";
import WidgetMenuDesktop from "./WidgetMenuDesktop";
import WidgetMenuIconBar from "./WidgetMenuIconBar";

export default function WidgetMenu() {
	const { general } = useSettings();
	const menuData: MenuData = general.menu || { design: {}, menus: [] };
	const router = useRouter();
	const { isAdmin, isManagerOrAdmin } = useAdmin();
	const [openFolders, setOpenFolders] = useState<OpenFolders>({});

	const BOARD_ROUTES: BoardRoutes = useMemo(
		() => ({
			라이브러리: "/library",
			아카이브: "/archive",
			갤러리: "/gallery",
			메모: "/memo",
			포토보드: "/photoboard",
			방명록: "/guestbook",
			설정: "/setting",
		}),
		[],
	);

	const getTextAlignClass = useCallback((textAlign: string) => {
		switch (textAlign) {
			case "왼쪽":
				return "justify-start";
			case "가운데":
				return "justify-center";
			default:
				return "justify-end";
		}
	}, []);

	const getBackgroundStyle = useCallback(
		(bgType: string, backgroundColor?: string, backgroundImage?: string) => {
			if (bgType === "단색" && backgroundColor) {
				return { backgroundColor };
			}
			if (bgType === "이미지" && backgroundImage) {
				return {
					backgroundImage: `url('${backgroundImage}')`,
					backgroundRepeat: "no-repeat",
					backgroundPosition: "center",
				};
			}
			return {};
		},
		[],
	);

	const getItemBackgroundStyle = useCallback((image?: string) => {
		return image ? { backgroundImage: `url('${image}')` } : {};
	}, []);

	const filteredMenuItems = useMemo(() => {
		const allMenuItems = menuData.menus || [];
		return allMenuItems.filter((item: MenuItem) => {
			if (item.category === "설정" && !isManagerOrAdmin) {
				return false;
			}

			const isPrivate = item.isPublic === false || item.allow === "private";
			if (isPrivate && !isAdmin) {
				return false;
			}

			return true;
		});
	}, [menuData.menus, isAdmin]);

	const design: MenuDesign = useMemo(
		() => menuData.design || {},
		[menuData.design],
	);

	const textAlignClass = useMemo(
		() => getTextAlignClass(design?.textAlign || ""),
		[design?.textAlign, getTextAlignClass],
	);

	const asideBackgroundStyle = useMemo(
		() =>
			getBackgroundStyle(
				design?.bgType || "",
				design?.backgroundColor,
				design?.backgroundImage,
			),
		[
			design?.bgType,
			design?.backgroundColor,
			design?.backgroundImage,
			getBackgroundStyle,
		],
	);

	const iconBarStyle = useMemo(
		() => ({
			backgroundColor:
				design?.iconBarBgType === "단색"
					? design?.iconBarBackgroundColor || "#ffffff"
					: "transparent",
			backgroundImage:
				design?.iconBarBgType === "이미지" && design?.iconBarBackgroundImage
					? `url('${design?.iconBarBackgroundImage}')`
					: "none",
			backgroundSize: "cover",
			backgroundPosition: "center",
		}),
		[
			design?.iconBarBgType,
			design?.iconBarBackgroundColor,
			design?.iconBarBackgroundImage,
		],
	);

	const toggleFolder = useCallback((uniqueId: string) => {
		setOpenFolders((prev) => ({
			...prev,
			[uniqueId]: !prev[uniqueId],
		}));
	}, []);

	const handleMenuClick = useCallback(
		(item: MenuItem) => (e: React.MouseEvent) => {
			e.preventDefault();

			if (item.category === "폴더") {
				toggleFolder(item.uniqueId);
			} else if (item.category === "커스텀" && item.url) {
				router.push(item.url);
			} else {
				const path = BOARD_ROUTES[item.category as keyof typeof BOARD_ROUTES];
				if (path) {
					router.push(path);
				} else {
				}
			}
		},
		[router, toggleFolder, BOARD_ROUTES],
	);

	const handleSubMenuClick = useCallback(
		(parentId: string, subMenuName: string) => {
			setOpenFolders((prev) => ({
				...prev,
				[parentId]: false,
			}));
			const path = BOARD_ROUTES[subMenuName];
			if (path) {
				router.push(path);
			}
		},
		[router, BOARD_ROUTES],
	);

	return (
		<>
			<WidgetMenuDesktop
				design={design}
				filteredMenuItems={filteredMenuItems}
				textAlignClass={textAlignClass}
				asideBackgroundStyle={asideBackgroundStyle}
				openFolders={openFolders}
				onMenuClick={handleMenuClick}
				onSubMenuClick={handleSubMenuClick}
				getItemBackgroundStyle={getItemBackgroundStyle}
			/>
			<WidgetMenuIconBar
				design={design}
				filteredMenuItems={filteredMenuItems}
				iconBarStyle={iconBarStyle}
				openFolders={openFolders}
				onMenuClick={handleMenuClick}
				onSubMenuClick={handleSubMenuClick}
			/>
		</>
	);
}
