/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";
import MenuAuthButton from "@/components/common/MenuAuthButton";
import { cn } from "@/lib/utils";
import type { MenuDesign, MenuItem, OpenFolders } from "./widgetMenuTypes";
import { Bell } from "lucide-react";

type Props = {
	design: MenuDesign;
	filteredMenuItems: MenuItem[];
	textAlignClass: string;
	asideBackgroundStyle: React.CSSProperties;
	openFolders: OpenFolders;
	onMenuClick: (item: MenuItem) => (e: React.MouseEvent) => void;
	onSubMenuClick: (parentId: string, subMenuName: string) => void;
	getItemBackgroundStyle: (image?: string) => React.CSSProperties;
};

const renderLogo = (design: MenuDesign) => {
	type MenuDesignWithLogo = MenuDesign & { logoText?: string; logoImage?: string };
	const designWithLogo = design as MenuDesignWithLogo;

	if (design?.logoType === "텍스트" && designWithLogo?.logoText) {
		return (
			<Link href="/" className="block">
				<div
					className="text-center mb-4 font-bold text-2xl min-[1200px]:text-4xl px-2 min-[1200px]:px-4 w-50 h-20 flex items-center justify-center break-keep transition-[font-size,padding] duration-300"
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

	if (design?.logoType !== "이미지" || !designWithLogo?.logoImage) {
		return null;
	}

	return (
		<Link href="/" className="block">
			<div className="max-w-[160px] min-[1200px]:max-w-[180px] aspect-square transition-[max-width] duration-300 mx-auto p-3 cursor-pointer">
				<Image
					className="w-full h-full block object-cover object-center"
					src={designWithLogo.logoImage}
					alt="Logo"
					width={180}
					height={180}
				/>
			</div>
		</Link>
	);
};

export default function WidgetMenuDesktop({
	design,
	filteredMenuItems,
	textAlignClass,
	asideBackgroundStyle,
	openFolders,
	onMenuClick,
	onSubMenuClick,
	getItemBackgroundStyle,
}: Props) {
	return (
		<aside
			className={cn(
				"menu-desktop w-[160px] min-[1200px]:w-[180px] min-w-[160px] h-dvh flex flex-col items-center justify-center shrink-0 sticky top-0",
				"transition-[width] duration-300 ease-in-out",
				design?.bgType === "없음" && "bg-transparent",
				"bg-center bg-no-repeat bg-cover",
			)}
			style={asideBackgroundStyle}
		>
			<nav
				className="w-full h-full flex flex-col justify-center"
				style={{ fontFamily: "var(--font-title)" }}
			>
				{renderLogo(design)}

				<ul className="flex flex-col gap-1 min-[1200px]:gap-2.5 list-none mt-2 min-h-40">
					{filteredMenuItems.map((item) => (
						<li
							key={item.uniqueId}
							className={cn("w-full flex flex-col overflow-hidden", textAlignClass)}
							style={{ transition: "all 300ms ease-in-out" }}
						>
							<a
								onClick={onMenuClick(item)}
								className={cn(
									"cursor-pointer font-medium text-sm min-[1200px]:text-base min-h-10 w-full px-3 min-[1200px]:px-7 flex items-center",
									"bg-no-repeat bg-contain bg-center hover:opacity-80 transition-[opacity,padding,font-size] duration-300",
									openFolders[item.uniqueId] && "open",
									textAlignClass,
								)}
								style={{
									...getItemBackgroundStyle(item.image),
									color: design?.fontColor,
									transition: "opacity 300ms ease, padding 300ms ease",
								}}
							>
								{!item.image && item.name}
							</a>

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
												textAlignClass,
											)}
										>
											<a
												className={cn(
													"text-xs min-[1200px]:text-sm min-h-9 w-full px-3 min-[1200px]:px-7 flex items-center cursor-pointer",
													"bg-no-repeat bg-contain bg-center",
													"hover:opacity-80 transition-[opacity,padding,font-size] duration-300",
													textAlignClass,
												)}
												style={{
													...getItemBackgroundStyle(subMenuImage),
													transition: "opacity 300ms ease, padding 300ms ease",
												}}
												onClick={() =>
													onSubMenuClick(item.uniqueId, subMenuName)
												}
											>
												{!subMenuImage && subMenuName}
											</a>
										</li>
									);
								})}
							</ul>
						</li>
					))}
				</ul>

				<div className="flex gap-2 flex-col items-center my-3">
					<button
						type="button"
						className={cn(
							"w-9 h-9 rounded-full flex items-center justify-center cursor-pointer",
							"hover:bg-theme-primary/60 hover:animate-jingle",
						)}
						style={{ transition: "all 300ms ease-in-out" }}
						aria-label="알림"
					>
						<Bell size={20} color={design?.fontColor || "#333"} />
					</button>

					<button
						type="button"
						className={cn(
							"w-9 h-9 rounded-full flex items-center justify-center cursor-pointer",
							"hover:bg-theme-primary/60",
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
				</div>

				<div className="flex justify-center">
					<MenuAuthButton />
				</div>
			</nav>
		</aside>
	);
}
