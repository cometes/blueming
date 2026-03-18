/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import {
	Archive,
	Bell,
	Book,
	Folder,
	Image as ImageIcon,
	Link,
	MessageCircle,
	Settings,
	Square,
} from "lucide-react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import MenuPreviewItem from "@/features/settings/components/menu/MenuPreviewItem";
import type { MenuDesign, MenuItem } from "@/features/settings/types";
import { ICON_BAR_WIDTH } from "@/features/settings/lib/menu";

interface MenuPreviewSectionProps {
	menus: MenuItem[];
	menuDesign: MenuDesign;
	openFolders: { [key: string]: boolean };
	onToggleFolder: (uniqueId: string) => void;
	onUpdateMenu: (index: number, updated: Partial<MenuItem>) => void;
	onDeleteMenu: (uniqueId: string) => void;
	onDragEnd: (result: DropResult) => void;
	boardArr: { label: string; value: string }[];
}

const getMenuIcon = (category: string) => {
	switch (category) {
		case "라이브러리":
			return <Book size={16} className="text-sub-text" />;
		case "아카이브":
			return <Archive size={16} className="text-sub-text" />;
		case "갤러리":
			return <ImageIcon size={16} className="text-sub-text" />;
		case "메모":
			return <MessageCircle size={16} className="text-sub-text" />;
		case "포토보드":
			return <ImageIcon size={16} className="text-sub-text" />;
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

export function MenuPreviewSection({
	menus,
	menuDesign,
	openFolders,
	onToggleFolder,
	onUpdateMenu,
	onDeleteMenu,
	onDragEnd,
	boardArr,
}: MenuPreviewSectionProps) {
	return (
		<section>
			<p className="text-sm text-sub-text mb-6">
				메뉴 텍스트 및 이미지를 설정합니다. 드래그 앤 드롭으로 순서를 변경할 수
				있습니다. 최대 8개까지 추가 가능합니다.
			</p>
			<div className="section-wrap flex justify-center gap-6 py-10 rounded-card border-card bg-card-bg">
				<aside
					className={cn(
						"w-[160px] h-[600px] rounded-xl shadow-2xl overflow-auto flex flex-col items-center justify-center",
						menuDesign.bgType === "없음" && "bg-transparent",
						"bg-center",
					)}
					style={{
						backgroundColor:
							menuDesign.bgType === "단색"
								? menuDesign.backgroundColor
								: "transparent",
						backgroundImage:
							menuDesign.bgType === "이미지" && menuDesign.backgroundImage
								? `url('${menuDesign.backgroundImage}')`
								: "none",
						backgroundSize: "cover",
						backgroundPosition: "center",
					}}
				>
					<nav
						className="w-full h-full flex flex-col justify-center py-6"
						style={{ fontFamily: "var(--font-title)" }}
					>
						{menuDesign.logoType === "이미지" && menuDesign.logoImage && (
							<div className="max-w-[160px] aspect-square px-4 mb-4">
								<Image
									className="w-full h-full block object-cover object-center rounded-lg"
									src={menuDesign.logoImage}
									alt="Logo"
									width={160}
									height={160}
								/>
							</div>
						)}
						{menuDesign.logoType === "텍스트" && menuDesign.logoText && (
							<div
								className="text-center mb-4 font-bold text-lg px-4 h-14 flex items-center justify-center break-keep"
								style={{ color: menuDesign.fontColor }}
							>
								{menuDesign.logoText}
							</div>
						)}

						<DragDropContext onDragEnd={onDragEnd}>
							<Droppable droppableId="menus">
								{(provided) => (
									<ul
										{...provided.droppableProps}
										ref={provided.innerRef}
										className="flex flex-col gap-2.5 list-none"
									>
										{menus.map((menu, index) => (
											<MenuPreviewItem
												key={menu.uniqueId}
												menu={menu}
												index={index}
												design={menuDesign}
												openFolders={openFolders}
												onToggleFolder={onToggleFolder}
												onUpdateMenu={(updated) => onUpdateMenu(index, updated)}
												handleDeleteMenu={onDeleteMenu}
												boardArr={boardArr}
											/>
										))}
										{provided.placeholder}
									</ul>
								)}
							</Droppable>
						</DragDropContext>

						<div className="flex gap-2 flex-col items-center my-4">
							<button
								type="button"
								className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out opacity-40 pointer-events-none"
								aria-label="알림"
							>
								<Bell size={18} color={menuDesign.fontColor || "#333"} />
							</button>
						</div>

						<div className="flex justify-center opacity-40 pointer-events-none px-4">
							<Button
								size="sm"
								style={{
									color: menuDesign.fontColor,
									borderColor: `${menuDesign.fontColor}33`,
								}}
							>
								로그인
							</Button>
						</div>
					</nav>
				</aside>

				<aside
					className="h-[600px] rounded-xl shadow-2xl overflow-visible flex flex-col items-center"
					style={{
						width: `${ICON_BAR_WIDTH}px`,
						backgroundColor:
							menuDesign.iconBarBgType === "단색"
								? menuDesign.iconBarBackgroundColor || "#ffffff"
								: "transparent",
						backgroundImage:
							menuDesign.iconBarBgType === "이미지" &&
							menuDesign.iconBarBackgroundImage
								? `url('${menuDesign.iconBarBackgroundImage}')`
								: "none",
						backgroundSize: "cover",
						backgroundPosition: "center",
					}}
				>
					<nav
						className="w-full h-full flex flex-col items-center justify-center py-6 overflow-visible gap-3"
						style={{ fontFamily: "var(--font-title)" }}
					>
						<div className="w-full flex items-center justify-center mb-6">
							{menuDesign.iconBarLogoType === "이미지" &&
							menuDesign.iconBarLogoImage ? (
								<img
									src={menuDesign.iconBarLogoImage}
									alt="Icon Bar Logo"
									className="w-10 h-10 rounded-full object-contain"
								/>
							) : menuDesign.iconBarLogoType === "이미지" ? (
								<div className="w-10 h-10 rounded-full bg-card-bg/70 flex items-center justify-center text-xs text-sub-text">
									LOGO
								</div>
							) : null}
						</div>
						<ul className="flex flex-col items-center gap-3">
							{menus.map((menu) => (
								<li key={menu.uniqueId} className="relative">
									<div className="relative group">
										{menu.iconImage ? (
											<div className="w-10 h-10 flex items-center justify-center leading-none">
												<img
													src={menu.iconImage}
													alt={menu.name}
													className="block w-10 h-10 object-contain"
												/>
											</div>
										) : (
											<button
												type="button"
												className="w-10 h-10 rounded-full bg-card-bg/60 border border-card flex items-center justify-center leading-none"
												onClick={() => {
													if (menu.category === "폴더")
														onToggleFolder(menu.uniqueId);
												}}
											>
												{getMenuIcon(menu.category)}
											</button>
										)}
										<span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-card bg-card-bg px-2 py-1 text-xs text-sub-text opacity-0 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0">
											{menu.name}
										</span>
									</div>
								</li>
							))}
						</ul>
					</nav>
				</aside>
			</div>
		</section>
	);
}
