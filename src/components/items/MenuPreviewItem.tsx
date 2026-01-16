"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { GripVertical, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MenuItem as MenuItemType, MenuDesign } from "@/contexts/SettingsContext";
import MenuEditModal from "@/components/modal/MenuEditModal";

interface MenuPreviewItemProps {
	menu: MenuItemType;
	index: number;
	design: MenuDesign;
	openFolders: { [key: string]: boolean };
	onToggleFolder: (uniqueId: string) => void;
	onUpdateMenu: (updatedMenu: Partial<MenuItemType>) => void;
	handleDeleteMenu: (uniqueId: string) => void;
	boardArr: { label: string; value: string }[];
}

export default function MenuPreviewItem({
	menu,
	index,
	design,
	openFolders,
	onToggleFolder,
	onUpdateMenu,
	handleDeleteMenu,
	boardArr,
}: MenuPreviewItemProps) {
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	// Text alignment class based on design settings
	const textAlignClass = (() => {
		switch (design?.textAlign) {
			case "왼쪽":
				return "justify-start";
			case "가운데":
				return "justify-center";
			default:
				return "justify-end";
		}
	})();

	const getItemBackgroundStyle = (image?: string) => {
		return image ? { backgroundImage: `url('${image}')` } : {};
	};

	const handleMenuClick = (e: React.MouseEvent) => {
		e.preventDefault();
		// Only toggle folders, no page navigation
		if (menu.type === "folder") {
			onToggleFolder(menu.uniqueId);
		}
	};

	return (
		<Draggable draggableId={menu.uniqueId} index={index}>
			{(provided) => (
				<li
					ref={provided.innerRef}
					{...provided.draggableProps}
					className={cn(
						"w-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out group relative",
						textAlignClass
					)}
				>
					{/* Drag Handle - Left absolute, visible on hover */}
					<div
						{...provided.dragHandleProps}
						className="absolute left-0 top-0 h-10 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-gradient-to-r from-black/20 to-transparent"
					>
						<GripVertical size={14} className="text-white drop-shadow" />
					</div>

					{/* Settings Icon - Right absolute, visible on hover */}
					<div className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={(e) => {
								e.stopPropagation();
								setIsEditModalOpen(true);
							}}
							className="h-7 w-7 rounded-full bg-card-bg/90 hover:bg-theme-primary hover:text-white shadow-md border border-card backdrop-blur-sm"
						>
							<Settings size={13} />
						</Button>
					</div>

					{/* Main Menu Item */}
					<a
						onClick={handleMenuClick}
						className={cn(
							"font-medium min-h-10 w-full px-7 flex items-center",
							"bg-no-repeat bg-contain bg-center transition-opacity cursor-pointer",
							menu.type === "folder" && "hover:opacity-80",
							openFolders[menu.uniqueId] && "open",
							textAlignClass
						)}
						style={{
							...getItemBackgroundStyle(menu.image),
							color: design?.fontColor,
						}}
					>
						{!menu.image && menu.name}
					</a>

					{/* Sub Menu */}
					{menu.type === "folder" && (
						<ul
							className="w-full overflow-hidden"
							style={{
								maxHeight: openFolders[menu.uniqueId] ? "320px" : "0px",
								opacity: openFolders[menu.uniqueId] ? 1 : 0,
								transition: "max-height 300ms ease, opacity 300ms ease",
							}}
						>
							{(menu.subMenus || []).map((subMenu, idx) => {
								const subMenuName = typeof subMenu === "string" ? subMenu : subMenu.name;
								const subMenuImage = typeof subMenu === "object" ? subMenu.image : undefined;

								return (
									<li
										key={`${menu.uniqueId}-sub-${idx}`}
										className={cn(
											"list-none w-full min-h-9 flex flex-col items-center",
											textAlignClass
										)}
									>
										<div
											className={cn(
												"text-sm min-h-9 w-full px-7 flex items-center",
												"transition-opacity duration-300 bg-no-repeat bg-contain bg-center",
												textAlignClass
											)}
											style={{
												...getItemBackgroundStyle(subMenuImage),
												color: design?.fontColor,
											}}
										>
											{!subMenuImage && subMenuName}
										</div>
									</li>
								);
							})}
						</ul>
					)}

					{/* Edit Modal */}
					<MenuEditModal
						isOpen={isEditModalOpen}
						onClose={() => setIsEditModalOpen(false)}
						menu={menu}
						boardArr={boardArr}
						onUpdateMenu={onUpdateMenu}
						handleDeleteMenu={handleDeleteMenu}
					/>
				</li>
			)}
		</Draggable>
	);
}
