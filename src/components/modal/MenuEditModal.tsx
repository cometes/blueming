"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Globe, Lock, Trash2, ImagePlus, X } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
	MenuItem as MenuItemType,
	SubMenu,
} from "@/contexts/SettingsContext";

interface MenuEditModalProps {
	isOpen: boolean;
	onClose: () => void;
	menu: MenuItemType;
	boardArr: { label: string; value: string }[];
	onUpdateMenu: (updatedMenu: Partial<MenuItemType>) => void;
	handleDeleteMenu: (uniqueId: string) => void;
}

export default function MenuEditModal({
	isOpen,
	onClose,
	menu,
	boardArr,
	onUpdateMenu,
	handleDeleteMenu,
}: MenuEditModalProps) {
	const { uploadFile } = useFileUpload();

	const handleChange = (field: keyof MenuItemType, value: any) => {
		onUpdateMenu({ [field]: value });
	};

	const handleAddSubMenu = (boardName: string) => {
		const currentSubMenus = (menu.subMenus || []) as (string | SubMenu)[];
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

	const menuTypeLabel = {
		posting: "포스팅",
		folder: "폴더",
		custom: "커스텀",
	}[menu.type || "custom"];

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className="max-w-md bg-card-bg border-card"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="text-xl font-bold flex items-center gap-2">
							메뉴 설정
							<Badge variant="secondary" className="px-2 py-0 text-[10px] h-5">
								{menuTypeLabel}
							</Badge>
						</DialogTitle>
					</div>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Name & Public State */}
					<div className="space-y-3">
						<div className="flex items-center gap-3">
							<div className="flex-1 space-y-1.5">
								<Label className="text-xs font-medium text-muted-foreground">
									메뉴명
								</Label>
								<Input
									placeholder="메뉴명을 입력하세요"
									value={menu.name}
									onChange={(e) => handleChange("name", e.target.value)}
									className="h-10 bg-muted/10 border-card focus:border-theme-primary transition-all"
								/>
							</div>
							<div className="w-[120px] space-y-1.5">
								<Label className="text-xs font-medium text-muted-foreground">
									공개 여부
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
									<SelectTrigger className="h-10 bg-muted/10 border-card">
										<div className="flex items-center gap-2">
											{menu.isPublic ? (
												<Globe size={14} className="text-theme-primary" />
											) : (
												<Lock size={14} className="text-muted-foreground" />
											)}
											<SelectValue />
										</div>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="public">전체 공개</SelectItem>
										<SelectItem value="private">비공개</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{/* Type Specific Fields */}
					<div className="space-y-3 pt-2 border-t border-card/40">
						{menu.type === "posting" && (
							<div className="space-y-1.5">
								<Label className="text-xs font-medium text-muted-foreground">
									게시판 선택
								</Label>
								<Select
									value={menu.category}
									onValueChange={(v) => handleChange("category", v)}
								>
									<SelectTrigger className="h-10 bg-muted/10 border-card">
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
							<div className="space-y-3">
								<div className="space-y-1.5">
									<Label className="text-xs font-medium text-muted-foreground">
										URL
									</Label>
									<Input
										placeholder="https://..."
										value={menu.url}
										onChange={(e) => handleChange("url", e.target.value)}
										className="h-10 bg-muted/10 border-card focus:border-theme-primary"
									/>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="new-tab-check"
										checked={menu.openInNewTab}
										onCheckedChange={(v: boolean) =>
											onUpdateMenu({ openInNewTab: v, target: v })
										}
									/>
									<Label
										htmlFor="new-tab-check"
										className="text-sm font-medium cursor-pointer"
									>
										새 탭에서 열기
									</Label>
								</div>
							</div>
						)}

						{menu.type === "folder" && (
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<Label className="text-xs font-medium text-muted-foreground">
										하위 메뉴
									</Label>
									<Select onValueChange={(v) => handleAddSubMenu(v)}>
										<SelectTrigger className="h-8 w-[140px] text-xs bg-muted/20 border-card">
											<SelectValue placeholder="추가하기" />
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
								</div>
								<div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
									{(menu.subMenus || []).map((sm, idx) => {
										const smName = typeof sm === "string" ? sm : sm.name;
										const smImage = typeof sm === "object" ? sm.image : "";
										return (
											<div
												key={idx}
												className="flex items-center justify-between bg-muted/20 rounded-lg p-2 border border-card/40"
											>
												<span className="text-sm font-medium flex-1">
													{smName}
												</span>
												<div className="flex items-center gap-2">
													{!smImage && (
														<label className="cursor-pointer p-1.5 hover:bg-card-bg rounded-md text-muted-foreground hover:text-theme-primary transition-all">
															<ImagePlus size={16} />
															<input
																type="file"
																className="hidden"
																accept="image/*"
																onChange={(e) => {
																	const file = e.target.files?.[0];
																	if (file) handleSubMenuImageUpload(file, idx);
																}}
															/>
														</label>
													)}
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleRemoveSubMenu(idx)}
														className="h-8 w-8 text-muted-foreground hover:text-destructive"
													>
														<Trash2 size={16} />
													</Button>
													{smImage && (
														<div className="relative w-[150px] max-h-9 rounded-md bg-theme-primary/10 border border-card overflow-hidden group">
															<img
																src={smImage}
																className="w-full h-full object-contain"
															/>
															<Button
																variant="ghost"
																size="icon"
																onClick={() => {
																	const currentSubMenus = (menu.subMenus ||
																		[]) as (string | SubMenu)[];
																	const updatedSubMenus = currentSubMenus.map(
																		(subMenu, i) => {
																			if (i === idx) {
																				const name =
																					typeof subMenu === "string"
																						? subMenu
																						: subMenu.name;
																				return { name, image: "" };
																			}
																			return subMenu;
																		}
																	);
																	handleChange("subMenus", updatedSubMenus);
																}}
																className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-0"
																style={{
																	backgroundColor: "#111",
																	color: "#fff",
																}}
															>
																<X size={10} />
															</Button>
														</div>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>

					{/* Image Settings */}
					<div className="space-y-3 pt-2 border-t border-card/40">
						<Label className="text-xs font-medium text-muted-foreground">
							메뉴 이미지
						</Label>

						<div className="p-3 bg-muted/15 rounded-xl border border-dashed border-card">
							<p className="text-[10px] text-muted-foreground mb-2">
								권장 사이즈: 220 * 80
							</p>
							{menu.image ? (
								<div className="relative aspect-[22/8] w-full max-w-[280px] rounded-lg border border-card overflow-hidden bg-card-bg group">
									<img
										src={menu.image}
										className="w-full h-full object-contain"
									/>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleChange("image", "")}
										className="absolute top-1 right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-0"
										style={{ backgroundColor: "#111", color: "#fff" }}
									>
										<X size={12} />
									</Button>
								</div>
							) : (
								<label className="flex flex-col items-center justify-center py-4 w-full cursor-pointer bg-card-bg/40 hover:bg-card-bg/70 border border-dashed border-card/70 rounded-xl transition-all gap-1.5 group">
									<ImagePlus
										size={20}
										className="text-muted-foreground group-hover:text-theme-primary transition-colors"
									/>
									<span className="text-[11px] font-medium text-muted-foreground group-hover:text-theme-primary transition-colors">
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

				<div className="flex items-center justify-between pt-4 border-t border-card/40">
					<Button
						variant="ghost"
						onClick={() => {
							if (confirm("정말 이 메뉴를 삭제하시겠습니까?")) {
								handleDeleteMenu(menu.uniqueId);
								onClose();
							}
						}}
						className="text-destructive/70 hover:text-destructive hover:bg-destructive/5"
					>
						<Trash2 size={16} className="mr-2" />
						메뉴 삭제
					</Button>
					<Button onClick={onClose} className="px-8">
						확인
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
