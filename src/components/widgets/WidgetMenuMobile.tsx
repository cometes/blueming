/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import MenuAuthButton from "@/components/common/MenuAuthButton";
import type { MenuDesign, MenuItem, OpenFolders } from "./widgetMenuTypes";

type Props = {
	design: MenuDesign;
	filteredMenuItems: MenuItem[];
	openFolders: OpenFolders;
	onMenuClick: (item: MenuItem) => (e: React.MouseEvent) => void;
	onSubMenuClick: (parentId: string, subMenuName: string) => void;
	getItemBackgroundStyle: (image?: string) => React.CSSProperties;
	className?: string;
};

type MenuDesignWithLogo = MenuDesign & {
	logoText?: string;
	logoImage?: string;
};

const getAlignClasses = (textAlign?: string) => {
	switch (textAlign) {
		case "왼쪽":
			return {
				items: "items-start",
				text: "text-left",
				justify: "justify-start",
			};
		case "가운데":
			return {
				items: "items-center",
				text: "text-center",
				justify: "justify-center",
			};
		default:
			return {
				items: "items-end",
				text: "text-right",
				justify: "justify-end",
			};
	}
};

export default function WidgetMenuMobile({
	design,
	filteredMenuItems,
	openFolders,
	onMenuClick,
	onSubMenuClick,
	getItemBackgroundStyle,
	className,
}: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const { general } = useSettings();
	const designWithLogo = design as MenuDesignWithLogo;
	const align = useMemo(
		() => getAlignClasses(design?.textAlign),
		[design?.textAlign],
	);

	const overlayStyle = useMemo(() => {
		if (design?.bgType === "이미지" && design?.backgroundImage) {
			return {
				backgroundImage: `url('${design.backgroundImage}')`,
				backgroundRepeat: "no-repeat",
				backgroundPosition: "center",
				backgroundSize: "cover",
			};
		}

		if (design?.bgType === "단색" && design?.backgroundColor) {
			return { backgroundColor: design.backgroundColor };
		}

		return { backgroundColor: "var(--card)" };
	}, [design?.bgType, design?.backgroundColor, design?.backgroundImage]);

	const handleMenuItemClick = (item: MenuItem) => (e: React.MouseEvent) => {
		onMenuClick(item)(e);
		if (item.category !== "폴더") {
			setIsOpen(false);
		}
	};

	const handleSubMenuItemClick = (parentId: string, subMenuName: string) => {
		onSubMenuClick(parentId, subMenuName);
		setIsOpen(false);
	};

	const renderHeaderLogo = () => {
		const generalLogo = general?.general;
		if (generalLogo?.logoType === "텍스트" && generalLogo?.logoText) {
			return (
				<Link href="/" className="block" onClick={() => setIsOpen(false)}>
					<h1 className="text-lg font-title font-bold tracking-normal">
						{generalLogo.logoText}
					</h1>
				</Link>
			);
		}

		if (generalLogo?.logoType === "이미지" && generalLogo?.logoImage) {
			return (
				<Link href="/" className="block" onClick={() => setIsOpen(false)}>
					<Image
						className="h-12 max-h-12 w-auto object-contain"
						src={generalLogo.logoImage}
						alt="로고"
						width={120}
						height={48}
					/>
				</Link>
			);
		}

		return null;
	};

	const renderMenuLogo = () => {
		if (design?.logoType === "텍스트" && designWithLogo?.logoText) {
			return (
				<Link href="/" className="block" onClick={() => setIsOpen(false)}>
					<div
						className={cn("font-bold text-3xl", align.text)}
						style={{
							color: design.fontColor,
							fontFamily: "var(--font-title)",
						}}
					>
						{designWithLogo.logoText}
					</div>
				</Link>
			);
		}

		if (design?.logoType === "이미지" && designWithLogo?.logoImage) {
			return (
				<Link href="/" className="block" onClick={() => setIsOpen(false)}>
					<Image
						className="max-w-[160px] h-auto object-contain"
						src={designWithLogo.logoImage}
						alt="Logo"
						width={140}
						height={140}
					/>
				</Link>
			);
		}

		return null;
	};

	useEffect(() => {
		if (!isOpen) return;
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = originalOverflow;
		};
	}, [isOpen]);

	return (
		<div className={cn("sm:hidden", className)}>
			<header className="fixed top-0 left-0 right-0 h-12 border-b border-card-bg z-50 flex items-center justify-between px-6 backdrop-blur-sm">
				{renderHeaderLogo()}
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-card-bg/60"
					style={{ transition: "background-color 0.3s ease" }}
					aria-label="메뉴 열기"
				>
					<Menu size={22} className="text-main-text" />
				</button>
			</header>

			<AnimatePresence>
				{isOpen ? (
					<motion.div
						className="fixed inset-0 z-[100]"
						style={overlayStyle}
						initial={{ y: "-100%" }}
						animate={{ y: 0 }}
						exit={{ y: "-100%" }}
						transition={{ duration: 0.35, ease: "easeInOut" }}
					>
						<div className="absolute top-4 right-4">
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer hover:bg-card-bg/60"
								style={{ transition: "background-color 0.3s ease" }}
								aria-label="메뉴 닫기"
							>
								<X size={22} className="text-main-text" />
							</button>
						</div>

						<nav
							className={cn(
								"h-full min-h-0 flex flex-col overflow-y-auto items-center justify-center gap-5",
								align.items,
								align.text,
							)}
							style={{ fontFamily: "var(--font-title)" }}
						>
							<div className={cn("w-full flex", align.justify)}>
								{renderMenuLogo()}
							</div>

							<ul className={cn("flex flex-col gap-3", align.items)}>
								{filteredMenuItems.map((item) => (
									<li
										key={item.uniqueId}
										className={cn("flex flex-col", align.items)}
									>
										<button
											type="button"
											onClick={handleMenuItemClick(item)}
											className={cn(
												"min-h-9 text-xl font-semibold cursor-pointer w-fit",
												item.image && "min-w-[180px]",
												"flex",
												align.justify,
												align.text,
											)}
											style={{
												...getItemBackgroundStyle(item.image),
												backgroundRepeat: "no-repeat",
												backgroundPosition: "center",
												backgroundSize: "contain",
												color: design?.fontColor,
											}}
										>
											{!item.image && item.name}
										</button>

										{item.category === "폴더" && item.subMenus?.length ? (
											<ul
												className={cn("overflow-hidden", align.items)}
												style={{
													maxHeight: openFolders[item.uniqueId] ? "360px" : "0px",
													opacity: openFolders[item.uniqueId] ? 1 : 0,
													overflow: "hidden",
													transition: "max-height 300ms ease, opacity 300ms ease",
												}}
											>
												{item.subMenus.map((subMenu, index) => {
													const subMenuName =
														typeof subMenu === "string" ? subMenu : subMenu.name;
													const subMenuImage =
														typeof subMenu === "object" ? subMenu.image : undefined;

													return (
														<li key={`${item.uniqueId}-sub-${index}`} className="">
															<button
																type="button"
																onClick={() =>
																	handleSubMenuItemClick(item.uniqueId, subMenuName)
																}
																className={cn(
																	"w-fit min-h-9 px-4 rounded-card text-lg",
																	subMenuImage && "min-w-[120px]",
																	"bg-card-bg/60 border border-card",
																	"flex",
																	align.justify,
																	align.text,
																)}
																style={{
																	...getItemBackgroundStyle(subMenuImage),
																	backgroundRepeat: "no-repeat",
																	backgroundPosition: "center",
																	backgroundSize: "contain",
																}}
															>
																{!subMenuImage && subMenuName}
															</button>
														</li>
													);
												})}
											</ul>
										) : null}
									</li>
								))}
							</ul>

							<div className={cn("flex gap-3", align.items)}>
								<button
									type="button"
									className={cn(
										"w-9 h-9 rounded-full flex items-center justify-center cursor-pointer",
										"bg-card-bg/60 hover:bg-theme-primary/60 hover:animate-jingle",
									)}
									style={{ transition: "all 300ms ease-in-out" }}
									aria-label="알림"
								>
									<Bell size={18} color={design?.fontColor || "#333"} />
								</button>
								<button
									type="button"
									className={cn(
										"w-9 h-9 rounded-full flex items-center justify-center cursor-pointer",
										"bg-card-bg/60 hover:bg-theme-primary/60",
									)}
									style={{ transition: "all 300ms ease-in-out" }}
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
						<MenuAuthButton
							variant="iconbar"
							className="w-9 h-9"
							dropdownPortal={false}
							dropdownSide="bottom"
							dropdownAlign="center"
						/>
							</div>
						</nav>
					</motion.div>
				) : null}
			</AnimatePresence>
		</div>
	);
}
