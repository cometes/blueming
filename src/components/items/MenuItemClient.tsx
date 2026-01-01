"use client";

import { useState, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import {
	ChevronDown,
	ImagePlus,
	Trash2,
	X,
	GripVertical,
	Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MenuItem, SubMenu } from "@/contexts/SettingsContext";

interface MenuItemProps {
	menu: MenuItem;
	index: number;
	boardArr: { label: string; value: string }[];
	onUpdateMenu: (updatedMenu: Partial<MenuItem>) => void;
	handleDeleteMenu: (uniqueId: string) => void;
}

export default function MenuItem({
	menu,
	index,
	boardArr,
	onUpdateMenu,
	handleDeleteMenu,
}: MenuItemProps) {
	const [imageActive, setImageActive] = useState(false);
	const { uploadFile, state: uploadState } = useFileUpload();

	const handleChange = (field: keyof MenuItem, value: any) => {
		onUpdateMenu({ [field]: value });
	};

	const handleAddSubMenu = (boardName: string) => {
		const currentSubMenus = (menu.subMenus || []) as (string | SubMenu)[];

		// Convert to object format if needed and check for duplicates
		const normalizedSubMenus = currentSubMenus.map((item) =>
			typeof item === "string" ? { name: item, image: "" } : item
		);

		if (normalizedSubMenus.some((m) => m.name === boardName)) {
			return;
		}

		handleChange("subMenus", [
			...normalizedSubMenus,
			{ name: boardName, image: "" },
		]);
	};

	const handleRemoveSubMenu = (idx: number) => {
		const currentSubMenus = (menu.subMenus || []) as (string | SubMenu)[];
		const updatedSubMenus = currentSubMenus.filter((_, i) => i !== idx);
		handleChange("subMenus", updatedSubMenus);
	};

	const handleSubMenuImageUpload = async (file: File, idx: number) => {
		try {
			const url = await uploadFile(file);
			const currentSubMenus = (menu.subMenus || []) as (string | SubMenu)[];
			const updatedSubMenus = currentSubMenus.map((subMenu, i) => {
				if (i === idx) {
					const name = typeof subMenu === "string" ? subMenu : subMenu.name;
					return { name, image: url };
				}
				return subMenu;
			});
			handleChange("subMenus", updatedSubMenus);
			toast.success("이미지가 업로드되었습니다.");
		} catch (error) {
			toast.error("이미지 업로드에 실패했습니다.");
		}
	};

	const handleRemoveSubMenuImage = (idx: number) => {
		const currentSubMenus = (menu.subMenus || []) as (string | SubMenu)[];
		const updatedSubMenus = currentSubMenus.map((subMenu, i) => {
			if (i === idx) {
				const name = typeof subMenu === "string" ? subMenu : subMenu.name;
				return { name, image: "" };
			}
			return subMenu;
		});
		handleChange("subMenus", updatedSubMenus);
	};

	const handleMainImageUpload = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const url = await uploadFile(file);
			handleChange("image", url);
			toast.success("이미지가 업로드되었습니다.");
		} catch (error) {
			toast.error("이미지 업로드에 실패했습니다.");
		}
	};

	return (
		<Draggable draggableId={menu.uniqueId} index={index}>
			{(provided) => (
				<div
					ref={provided.innerRef}
					{...provided.draggableProps}
					className="bg-card-bg border border-card rounded-card mb-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
				>
					<div className="flex items-center gap-4 p-4 border-b border-card bg-muted/30">
						<div
							{...provided.dragHandleProps}
							className="cursor-grab active:cursor-grabbing"
						>
							<GripVertical className="text-muted-foreground" size={20} />
						</div>
						<div className="flex-1 flex items-center justify-between">
							<span className="text-sm font-semibold text-sub-text">
								{menu.type === "posting"
									? "포스팅형"
									: menu.type === "folder"
									? "폴더형"
									: "커스텀"}
							</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleDeleteMenu(menu.uniqueId)}
								className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
							>
								<Trash2 size={16} className="mr-1" />
								삭제
							</Button>
						</div>
					</div>

					<div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Left Column: Name and Type Specific */}
						<div className="space-y-4">
							<div className="space-y-2">
								<Label className="text-xs font-medium text-muted-foreground">
									메뉴명
								</Label>
								<Input
									placeholder="메뉴명을 입력하세요"
									value={menu.name}
									onChange={(e) => handleChange("name", e.target.value)}
									className="h-9"
								/>
							</div>

							{menu.type === "posting" && (
								<div className="space-y-2">
									<Label className="text-xs font-medium text-muted-foreground">
										게시판
									</Label>
									<Select
										value={menu.category}
										onValueChange={(v) => handleChange("category", v)}
									>
										<SelectTrigger className="h-9">
											<SelectValue placeholder="게시판 선택" />
										</SelectTrigger>
										<SelectContent>
											{boardArr.map((board) => (
												<SelectItem key={board.value} value={board.value}>
													{board.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}

							{menu.type === "custom" && (
								<div className="space-y-2">
									<Label className="text-xs font-medium text-muted-foreground">
										URL
									</Label>
									<Input
										placeholder="https://example.com"
										value={menu.url}
										onChange={(e) => handleChange("url", e.target.value)}
										className="h-9"
									/>
								</div>
							)}

							{menu.type === "folder" && (
								<div className="space-y-2">
									<Label className="text-xs font-medium text-muted-foreground">
										하위 메뉴
									</Label>
									<Select onValueChange={(v) => handleAddSubMenu(v)}>
										<SelectTrigger className="h-9">
											<SelectValue placeholder="하위 페이지 추가" />
										</SelectTrigger>
										<SelectContent>
											{boardArr
												.filter((board) => {
													const currentSubMenus = (menu.subMenus || []) as (
														| string
														| SubMenu
													)[];
													return !currentSubMenus.some(
														(sm) =>
															(typeof sm === "string" ? sm : sm.name) ===
															board.value
													);
												})
												.map((board) => (
													<SelectItem key={board.value} value={board.value}>
														{board.label}
													</SelectItem>
												))}
										</SelectContent>
									</Select>

									<div className="mt-2 space-y-2">
										{(menu.subMenus || []).map((sm, idx) => {
											const smName = typeof sm === "string" ? sm : sm.name;
											const smImage = typeof sm === "object" ? sm.image : "";
											return (
												<div
													key={idx}
													className="flex flex-col border border-card rounded-lg p-2 bg-muted/20"
												>
													<div className="flex items-center justify-between">
														<span className="text-sm font-medium">
															{smName}
														</span>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleRemoveSubMenu(idx)}
															className="h-7 w-7 p-0"
														>
															<Trash2 size={14} />
														</Button>
													</div>

													<div className="mt-2">
														{smImage ? (
															<div className="relative w-full h-16 rounded border overflow-hidden">
																<img
																	src={smImage}
																	className="w-full h-full object-cover"
																/>
																<button
																	onClick={() => handleRemoveSubMenuImage(idx)}
																	className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
																>
																	<X size={12} />
																</button>
															</div>
														) : (
															<label className="flex flex-col items-center justify-center h-16 border border-dashed rounded cursor-pointer hover:bg-muted/50 transition-colors">
																<ImagePlus
																	size={16}
																	className="text-muted-foreground mb-1"
																/>
																<span className="text-[10px] text-muted-foreground">
																	이미지 업로드
																</span>
																<input
																	type="file"
																	className="hidden"
																	accept="image/*"
																	onChange={(e) => {
																		const file = e.target.files?.[0];
																		if (file)
																			handleSubMenuImageUpload(file, idx);
																	}}
																/>
															</label>
														)}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}
						</div>

						{/* Right Column: Visibility and Main Image */}
						<div className="space-y-4">
							<div className="space-y-2">
								<Label className="text-xs font-medium text-muted-foreground">
									공개 설정
								</Label>
								<Select
									value={menu.isPublic ? "public" : "private"}
									onValueChange={(v) => {
										const isPub = v === "public";
										onUpdateMenu({
											isPublic: isPub,
											allow: isPub ? "all" : "private",
										});
									}}
								>
									<SelectTrigger className="h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="public">전체 공개</SelectItem>
										<SelectItem value="private">비공개</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{menu.type === "custom" && (
								<div className="flex items-center space-x-2 py-2">
									<Checkbox
										id={`newtab-${menu.uniqueId}`}
										checked={menu.openInNewTab}
										onCheckedChange={(v: boolean) =>
											onUpdateMenu({ openInNewTab: v, target: v })
										}
									/>
									<Label
										htmlFor={`newtab-${menu.uniqueId}`}
										className="text-sm"
									>
										새 탭에서 열기
									</Label>
								</div>
							)}

							<div className="space-y-2">
								<Label className="text-xs font-medium text-muted-foreground">
									메뉴 이미지 (최적 220 * 80)
								</Label>
								{menu.image ? (
									<div className="relative aspect-[22/8] w-full rounded-card border overflow-hidden bg-muted/10">
										<img
											src={menu.image}
											className="w-full h-full object-contain"
										/>
										<Button
											variant="destructive"
											size="icon"
											className="absolute top-2 right-2 h-6 w-6"
											onClick={() => handleChange("image", "")}
										>
											<X size={14} />
										</Button>
									</div>
								) : (
									<label className="flex flex-col items-center justify-center aspect-[22/8] w-full border border-dashed rounded-card cursor-pointer hover:bg-muted/50 transition-colors">
										<ImagePlus
											size={28}
											className="text-muted-foreground mb-2"
										/>
										<span className="text-xs text-muted-foreground">
											이미지 업로드
										</span>
										<input
											type="file"
											className="hidden"
											accept="image/*"
											onChange={handleMainImageUpload}
										/>
									</label>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</Draggable>
	);
}
