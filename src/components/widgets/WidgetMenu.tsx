/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";
import { useState, useMemo, useCallback } from "react";
import {
	Bell,
	Square,
	Book,
	Archive,
	Image as ImageIcon,
	MessageCircle,
	Settings,
	Folder,
	Link,
} from "lucide-react";
import { useAdmin } from "@/hooks/auth/UseAdmin";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import Image from "next/image";

// =============================================================================
// TYPES
// =============================================================================

interface MenuItem {
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

interface MenuDesign {
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

interface MenuData {
	design: MenuDesign;
	menus: MenuItem[];
}

interface OpenFolders {
	[key: string]: boolean;
}

type BoardRoutes = {
	[key: string]: string;
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function WidgetMenu() {
	// -------------------------------------------------------------------------
	// HOOKS & STATE
	// -------------------------------------------------------------------------

	const { general } = useSettings();
	const menuData: MenuData = general.menu || { design: {}, menus: [] };
	const router = useRouter();
	const { isAdmin } = useAdmin();
	const [openFolders, setOpenFolders] = useState<OpenFolders>({});

	// -------------------------------------------------------------------------
	// CONSTANTS
	// -------------------------------------------------------------------------

	const BOARD_ROUTES: BoardRoutes = useMemo(
		() => ({
			라이브러리: "/library",
			아카이브: "/archive",
			갤러리: "/gallery",
			스레드: "/thread",
			설정: "/setting",
		}),
		[]
	);

	// -------------------------------------------------------------------------
	// HELPER FUNCTIONS
	// -------------------------------------------------------------------------

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
				return { backgroundImage: `url('${backgroundImage}')` };
			}
			return {};
		},
		[]
	);

	const getItemBackgroundStyle = useCallback((image?: string) => {
		return image ? { backgroundImage: `url('${image}')` } : {};
	}, []);

	// -------------------------------------------------------------------------
	// MEMOIZED VALUES
	// -------------------------------------------------------------------------

	// Filter menu items based on admin status
	const filteredMenuItems = useMemo(() => {
		const allMenuItems = menuData.menus || [];
		return allMenuItems.filter((item: MenuItem) => {
			// Hide settings menu for non-admin users
			if (item.category === "설정" && !isAdmin) {
				return false;
			}

			// Hide private menus for non-admin users
			const isPrivate = item.isPublic === false || item.allow === "private";
			if (isPrivate && !isAdmin) {
				return false;
			}

			return true;
		});
	}, [menuData.menus, isAdmin]);

	// Design settings
	const design: MenuDesign = useMemo(
		() => menuData.design || {},
		[menuData.design]
	);

	const textAlignClass = useMemo(
		() => getTextAlignClass(design?.textAlign || ""),
		[design?.textAlign, getTextAlignClass]
	);

	const asideBackgroundStyle = useMemo(
		() =>
			getBackgroundStyle(
				design?.bgType || "",
				design?.backgroundColor,
				design?.backgroundImage
			),
		[
			design?.bgType,
			design?.backgroundColor,
			design?.backgroundImage,
			getBackgroundStyle,
		]
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
		]
	);

	// -------------------------------------------------------------------------
	// EVENT HANDLERS
	// -------------------------------------------------------------------------

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
		[router, toggleFolder, BOARD_ROUTES]
	);

	// -------------------------------------------------------------------------
	// RENDER HELPERS
	// -------------------------------------------------------------------------

	const renderLogo = () => {
		if (design?.logoType !== "이미지" || !design?.logoImage) return null;

		return (
			<div className="max-w-[200px] aspect-square">
				<Image
					className="w-full h-full block object-cover object-center"
					src={design.logoImage}
					alt="Logo"
					width={200}
					height={200}
				/>
			</div>
		);
	};

	const renderIconBarLogo = () => {
		if (design?.iconBarLogoType !== "이미지") {
			return null;
		}

		if (!design?.iconBarLogoImage) {
			return (
				<div className="w-10 h-10 rounded-full bg-card-bg/70 flex items-center justify-center text-xs text-sub-text">
					LOGO
				</div>
			);
		}

		return (
			<img
				src={design.iconBarLogoImage}
				alt="Icon bar logo"
				className="w-10 h-10 rounded-full object-contain"
			/>
		);
	};

	const getMenuIcon = (category: string) => {
		switch (category) {
			case "라이브러리":
				return <Book size={16} className="text-sub-text" />;
			case "아카이브":
				return <Archive size={16} className="text-sub-text" />;
			case "갤러리":
				return <ImageIcon size={16} className="text-sub-text" />;
			case "스레드":
				return <MessageCircle size={16} className="text-sub-text" />;
			case "설정":
				return <Settings size={16} className="text-sub-text" />;
			case "폴더":
				return <Folder size={16} className="text-sub-text" />;
			case "커스텀":
				return <Link size={16} className="text-sub-text" />;
			default:
				return <Square size={16} className="text-sub-text" />;
		}
	};

	const renderSubMenu = (item: MenuItem) => {
		return (
			<ul
				className="w-full overflow-hidden"
				style={{
					maxHeight: openFolders[item.uniqueId] ? "320px" : "0px",
					opacity: openFolders[item.uniqueId] ? 1 : 0,
					transition: "max-height 300ms ease, opacity 300ms ease",
				}}
			>
				{item.subMenus?.map((subMenu, index) => {
					const subMenuName =
						typeof subMenu === "string" ? subMenu : subMenu.name;
					const subMenuImage =
						typeof subMenu === "object" ? subMenu.image : undefined;

					return (
						<li
							key={`${item.uniqueId}-sub-${index}`}
							className={cn(
								"list-none w-full min-h-9 flex flex-col items-center",
								textAlignClass
							)}
						>
							<a
								className={cn(
									"text-sm min-h-9 w-full px-7 flex items-center cursor-pointer",
									"transition-opacity duration-300 bg-no-repeat bg-contain bg-center",
									"hover:opacity-80",
									textAlignClass
								)}
								style={getItemBackgroundStyle(subMenuImage)}
								onClick={() => {
									router.push(BOARD_ROUTES[subMenuName]);
								}}
							>
								{!subMenuImage && subMenuName}
							</a>
						</li>
					);
				})}
			</ul>
		);
	};

	const renderMenuItem = (item: MenuItem) => {
		return (
			<li
				key={item.uniqueId}
				className={cn(
					"w-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
					textAlignClass
				)}
			>
				{/* Main Menu Item */}
				<a
					onClick={handleMenuClick(item)}
					className={cn(
						"cursor-pointer font-medium min-h-10 w-full px-7 flex items-center",
						"bg-no-repeat bg-contain bg-center hover:opacity-80 transition-opacity",
						openFolders[item.uniqueId] && "open",
						textAlignClass
					)}
					style={{
						...getItemBackgroundStyle(item.image),
						color: design?.fontColor,
					}}
				>
					{!item.image && item.name}
				</a>

				{/* Sub Menu */}
				{renderSubMenu(item)}
			</li>
		);
	};

	const renderActionButtons = () => {
		return (
			<div className="flex gap-2 flex-col items-center my-3">
				{/* Notification Button */}
				<button
					type="button"
					className={cn(
						"w-9 h-9 rounded-full flex items-center justify-center cursor-pointer",
						"transition-all duration-300 ease-in-out",
						"hover:bg-gray-50/60 hover:animate-jingle"
					)}
					aria-label="알림"
				>
					<Bell size={20} color={design?.fontColor || "#333"} />
				</button>

				{/* Music Button */}
				<button
					type="button"
					className={cn(
						"w-9 h-9 rounded-full flex items-center justify-center cursor-pointer",
						"transition-all duration-300 ease-in-out hover:bg-gray-50/60"
					)}
					aria-label="음악"
				>
					<div className="flex items-end justify-center w-4 h-4">
						{[0, 0.1, 0.2, 0.3, 0.4].map((delay, index) => (
							<span
								key={index}
								style={{
									display: "block",
									width: "1px",
									background: design?.fontColor || "#333333",
									margin: "0 1px",
									height: ["6px", "8px", "10px", "13px", "15px"][index],
									animation: `musicBar 1.2s ease infinite ${delay}s`,
								}}
							/>
						))}
					</div>
				</button>
			</div>
		);
	};

	// -------------------------------------------------------------------------
	// MAIN RENDER
	// -------------------------------------------------------------------------

	return (
		<>
			<aside
				className={cn(
					"menu-desktop max-w-[200px] h-dvh flex flex-col items-center justify-center shrink-0 sticky top-0",
					design?.bgType === "없음" && "bg-transparent",
					"bg-center"
				)}
				style={asideBackgroundStyle}
			>
				<nav className="w-full h-full flex flex-col justify-center">
					{/* Logo */}
					{renderLogo()}

					{/* Menu Items */}
					<ul className="flex flex-col gap-2.5 list-none mt-2">
						{filteredMenuItems.map(renderMenuItem)}
					</ul>

					{/* Action Buttons */}
					{renderActionButtons()}

					{/* Login Button */}
					<div className="flex justify-center">
						<Button>로그인</Button>
					</div>
				</nav>
			</aside>

			<aside
				className="menu-iconbar w-[88px] h-dvh flex flex-col items-center shrink-0 sticky top-0 overflow-visible"
				style={iconBarStyle}
			>
				<nav className="w-full h-full flex flex-col items-center py-6 overflow-visible">
					<div className="w-full flex items-center justify-center mb-6">
						{renderIconBarLogo()}
					</div>

					<ul className="flex flex-col items-center gap-3 flex-1">
						{filteredMenuItems.map((item) => (
							<li key={item.uniqueId} className="relative">
								<div className="relative group">
									{item.iconImage ? (
										<button
											type="button"
											onClick={handleMenuClick(item)}
											className="w-10 h-10 flex items-center justify-center leading-none"
										>
											<img
												src={item.iconImage}
												alt={item.name}
												className="block w-10 h-10 object-contain"
											/>
										</button>
									) : (
										<button
											type="button"
											onClick={handleMenuClick(item)}
											className="w-10 h-10 rounded-full bg-card-bg/60 border border-card flex items-center justify-center leading-none"
										>
											{getMenuIcon(item.category)}
										</button>
									)}
									<span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-card bg-card-bg px-2 py-1 text-xs text-sub-text opacity-0 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0">
										{item.name}
									</span>
								</div>
								{item.category === "폴더" && item.subMenus?.length ? (
									<ul
										className="flex flex-col items-center gap-2 overflow-hidden"
										style={{
											marginTop: openFolders[item.uniqueId] ? "8px" : "0px",
											maxHeight: openFolders[item.uniqueId] ? "160px" : "0px",
											opacity: openFolders[item.uniqueId] ? 1 : 0,
											transition: "max-height 300ms ease, opacity 300ms ease",
										}}
									>
										{item.subMenus.map((subMenu, idx) => {
											const name =
												typeof subMenu === "string" ? subMenu : subMenu.name;
											return (
												<li key={`${item.uniqueId}-sub-${idx}`}>
													<div className="relative group">
														<button
															type="button"
															onClick={() => {
																const path =
																	BOARD_ROUTES[name as keyof typeof BOARD_ROUTES];
																if (path) {
																	router.push(path);
																}
															}}
															className="w-8 h-8 rounded-full bg-card-bg/60 border border-card flex items-center justify-center"
														>
															{getMenuIcon(name)}
														</button>
														<span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-card bg-card-bg px-2 py-1 text-xs text-sub-text opacity-0 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0">
															{name}
														</span>
													</div>
												</li>
											);
										})}
									</ul>
								) : null}
							</li>
						))}
					</ul>

					<div className="flex flex-col items-center gap-3 mb-6">
						<button
							type="button"
							className="w-10 h-10 rounded-full bg-card-bg/60 border border-card flex items-center justify-center opacity-80"
							aria-label="알림"
						>
							<Bell size={18} className="text-sub-text" />
						</button>
						<button
							type="button"
							className="w-10 h-10 rounded-full bg-card-bg/60 border border-card flex items-center justify-center opacity-80"
							aria-label="음악"
						>
							<div className="flex items-end justify-center w-4 h-4">
								{[0, 0.1, 0.2, 0.3, 0.4].map((delay, index) => (
									<span
										key={index}
										style={{
											display: "block",
											width: "1px",
											background: design?.fontColor || "#333333",
											margin: "0 1px",
											height: ["6px", "8px", "10px", "13px", "15px"][index],
											animation: `musicBar 1.2s ease infinite ${delay}s`,
										}}
									/>
								))}
							</div>
						</button>
					</div>

					<div className="flex justify-center">
						<Button size="sm" className="opacity-80">
							로그인
						</Button>
					</div>
				</nav>
			</aside>
		</>
	);
}
