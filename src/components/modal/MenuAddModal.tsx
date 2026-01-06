/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Globe, Lock, Trash2, ImagePlus, X } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "sonner";

interface SubMenu {
	name: string;
	image: string;
}

type MenuTab = "posting" | "folder" | "custom";

type MenuFormData = {
	name: string;
	category: string;
	url: string;
	isPublic: boolean;
	openInNewTab: boolean;
	subMenus: (string | SubMenu)[];
	image: string;
	iconImage: string;
};

interface MenuAddModalProps {
	isModalOpen: boolean;
	setIsModalOpen: (open: boolean) => void;
	onAddMenu: (data: MenuFormData & { type: MenuTab }) => void;
	boardArr: { label: string; value: string }[];
	cancelModal: () => void;
}

export default function MenuAddModal({
	isModalOpen,
	setIsModalOpen,
	onAddMenu,
	boardArr,
	cancelModal,
}: MenuAddModalProps) {
	const { uploadFile } = useFileUpload();
	const [activeTab, setActiveTab] = useState<MenuTab>("posting");
	const [formData, setFormData] = useState<MenuFormData>({
		name: "",
		category: "",
		url: "",
		isPublic: true,
		openInNewTab: false,
		subMenus: [] as (string | SubMenu)[],
		image: "",
		iconImage: "",
	});

	const handleAdd = () => {
		if (!formData.name) return;
		onAddMenu({ ...formData, type: activeTab });
		setFormData({
			name: "",
			category: "",
			url: "",
			isPublic: true,
			openInNewTab: false,
			subMenus: [],
			image: "",
			iconImage: "",
		});
		setIsModalOpen(false);
	};

	const handleAddSubMenu = (boardName: string) => {
		const normalizedSubMenus = formData.subMenus.map((item) =>
			typeof item === "string" ? { name: item, image: "" } : item
		);
		if (normalizedSubMenus.some((m) => m.name === boardName)) return;
		setFormData({
			...formData,
			subMenus: [...normalizedSubMenus, { name: boardName, image: "" }],
		});
	};

	const handleRemoveSubMenu = (idx: number) => {
		setFormData({
			...formData,
			subMenus: formData.subMenus.filter((_, i) => i !== idx),
		});
	};

	const handleMainImageUpload = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const url = await uploadFile(file);
			setFormData({ ...formData, image: url });
			toast.success("이미지가 업로드되었습니다.");
		} catch {
			toast.error("이미지 업로드에 실패했습니다.");
		}
	};

	const handleIconImageUpload = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const url = await uploadFile(file);
			setFormData({ ...formData, iconImage: url });
			toast.success("아이콘 이미지가 업로드되었습니다.");
		} catch {
			toast.error("아이콘 이미지 업로드에 실패했습니다.");
		}
	};

	const handleSubMenuImageUpload = async (file: File, idx: number) => {
		try {
			const url = await uploadFile(file);
			const updatedSubMenus = formData.subMenus.map((subMenu, i) => {
				if (i === idx) {
					const name = typeof subMenu === "string" ? subMenu : subMenu.name;
					return { name, image: url };
				}
				return subMenu;
			});
			setFormData({ ...formData, subMenus: updatedSubMenus });
			toast.success("이미지가 업로드되었습니다.");
		} catch {
			toast.error("이미지 업로드에 실패했습니다.");
		}
	};

	return (
		<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
			<DialogContent
				className="max-w-md bg-card-bg border-card rounded-card"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="text-xl font-bold flex items-center gap-2">
							메뉴 추가
							<Badge variant="secondary" className="px-2 py-0 text-[10px] h-5">
								{activeTab === "posting" ? "포스팅" : activeTab === "folder" ? "폴더" : "커스텀"}
							</Badge>
						</DialogTitle>
					</div>
					<DialogDescription className="text-sm text-sub-text">
						메뉴 타입과 정보를 입력해 추가하세요.
					</DialogDescription>
				</DialogHeader>
				<Tabs
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as MenuTab)}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-3 mb-4 bg-card-bg border border-card rounded-card">
						<TabsTrigger value="posting" className="text-xs">포스팅</TabsTrigger>
						<TabsTrigger value="folder" className="text-xs">폴더</TabsTrigger>
						<TabsTrigger value="custom" className="text-xs">커스텀</TabsTrigger>
					</TabsList>

					<div className="space-y-6 py-4">
						<div className="flex items-center gap-3">
							<div className="flex-1 space-y-1.5">
								<Label className="text-xs font-medium text-sub-text">
									메뉴명
								</Label>
								<Input
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="메뉴명을 입력하세요"
									className="h-10 rounded-card border-card bg-card-bg focus:border-card-active transition-all"
								/>
							</div>
							<div className="w-[120px] space-y-1.5">
								<Label className="text-xs font-medium text-sub-text">
									공개 여부
								</Label>
								<Select
									value={formData.isPublic ? "public" : "private"}
									onValueChange={(v) =>
										setFormData({ ...formData, isPublic: v === "public" })
									}
								>
									<SelectTrigger className="h-10 rounded-card border-card bg-card-bg">
										<div className="flex items-center gap-2">
											{formData.isPublic ? (
												<Globe size={14} className="text-theme-primary" />
											) : (
												<Lock size={14} className="text-sub-text" />
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

						<div className="space-y-3 pt-2 border-t border-card/40">
							<TabsContent value="posting" className="mt-0">
								<div className="space-y-1.5">
									<Label className="text-xs font-medium text-sub-text">
										게시판 선택
									</Label>
									<Select
										value={formData.category}
										onValueChange={(v) =>
											setFormData({ ...formData, category: v })
										}
									>
										<SelectTrigger className="h-10 rounded-card border-card bg-card-bg">
											<SelectValue placeholder="게시판을 선택하세요" />
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
							</TabsContent>

							<TabsContent value="folder" className="mt-0">
								<div className="space-y-3">
									<div className="flex items-center justify-between">
									<Label className="text-xs font-medium text-sub-text">
										하위 메뉴
									</Label>
									<Select onValueChange={(v) => handleAddSubMenu(v)}>
										<SelectTrigger className="h-8 w-[140px] text-xs rounded-card border-card bg-card-bg">
											<SelectValue placeholder="추가하기" />
										</SelectTrigger>
										<SelectContent>
											{boardArr
												.filter((board) => {
													return !formData.subMenus.some(
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
								{formData.subMenus.length > 0 && (
									<div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
										{formData.subMenus.map((sm, idx) => {
											const smName = typeof sm === "string" ? sm : sm.name;
											const smImage = typeof sm === "object" ? sm.image : "";
											return (
												<div
													key={idx}
													className="flex items-center justify-between bg-card-bg rounded-card p-2 border border-card"
												>
													<span className="text-sm font-medium flex-1">
														{smName}
													</span>
													<div className="flex items-center gap-2">
														{!smImage && (
															<label className="cursor-pointer p-1.5 hover:bg-card-bg rounded-md text-sub-text hover:text-theme-primary transition-all">
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
															className="h-8 w-8 text-sub-text hover:text-destructive"
														>
															<Trash2 size={16} />
														</Button>
														{smImage && (
															<div className="relative w-[150px] max-h-9 rounded-card bg-theme-primary/10 border border-card overflow-hidden group">
																<img
																	src={smImage}
																	alt="하위 메뉴 이미지"
																	className="w-full h-full object-contain"
																/>
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => {
																		const updatedSubMenus = formData.subMenus.map(
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
																		setFormData({
																			...formData,
																			subMenus: updatedSubMenus,
																		});
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
								)}
								{formData.subMenus.length === 0 && (
									<p className="text-xs text-sub-text text-center py-2">
										하위 메뉴를 추가해보세요
									</p>
								)}
							</div>
						</TabsContent>

							<TabsContent value="custom" className="mt-0">
								<div className="space-y-3">
									<div className="space-y-1.5">
										<Label className="text-xs font-medium text-sub-text">
											URL
										</Label>
										<Input
											value={formData.url}
											onChange={(e) =>
												setFormData({ ...formData, url: e.target.value })
											}
											placeholder="https://..."
											className="h-10 rounded-card border-card bg-card-bg focus:border-card-active"
										/>
									</div>
									<div className="flex items-center space-x-2">
										<Checkbox
											id="openInNewTab"
											checked={formData.openInNewTab}
											onCheckedChange={(v: boolean) =>
												setFormData({ ...formData, openInNewTab: v })
											}
										/>
										<Label
											htmlFor="openInNewTab"
											className="text-sm font-medium cursor-pointer text-sub-text"
										>
											새 탭에서 열기
										</Label>
									</div>
								</div>
							</TabsContent>
						</div>

						{/* Image Settings */}
						<div className="space-y-3 pt-2 border-t border-card/40">
							<Label className="text-xs font-medium text-sub-text">
								메뉴 이미지
							</Label>

							<div className="p-3 bg-card-bg rounded-card border border-dashed border-card">
								<p className="text-[10px] text-sub-text mb-2">
									권장 사이즈: 220 * 80
								</p>
								{formData.image ? (
									<div className="relative aspect-[22/8] w-full max-w-[280px] rounded-card border border-card overflow-hidden bg-card-bg group">
										<img
											src={formData.image}
											alt="메뉴 이미지"
											className="w-full h-full object-contain"
										/>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setFormData({ ...formData, image: "" })}
											className="absolute top-1 right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-0"
											style={{ backgroundColor: "#111", color: "#fff" }}
										>
											<X size={12} />
										</Button>
									</div>
								) : (
									<label className="flex flex-col items-center justify-center py-4 w-full cursor-pointer bg-card-bg hover:bg-card-bg/70 border border-dashed border-card rounded-card transition-all gap-1.5 group">
										<ImagePlus
											size={20}
											className="text-sub-text group-hover:text-theme-primary transition-colors"
										/>
										<span className="text-[11px] font-medium text-sub-text group-hover:text-theme-primary transition-colors">
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

						<div className="space-y-3 pt-2 border-t border-card/40">
							<Label className="text-xs font-medium text-sub-text">
								아이콘바 아이콘 이미지
							</Label>

							<div className="p-3 bg-card-bg rounded-card border border-dashed border-card">
								<p className="text-[10px] text-sub-text mb-2">
									권장 사이즈: 64 * 64
								</p>
								{formData.iconImage ? (
									<div className="relative aspect-square w-16 rounded-card border border-card overflow-hidden bg-card-bg group">
										<img
											src={formData.iconImage}
											alt="아이콘 이미지"
											className="w-full h-full object-contain"
										/>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setFormData({ ...formData, iconImage: "" })}
											className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-0"
											style={{ backgroundColor: "#111", color: "#fff" }}
										>
											<X size={10} />
										</Button>
									</div>
								) : (
									<label className="flex flex-col items-center justify-center py-3 w-20 cursor-pointer bg-card-bg hover:bg-card-bg/70 border border-dashed border-card rounded-card transition-all gap-1.5 group">
										<ImagePlus
											size={18}
											className="text-sub-text group-hover:text-theme-primary transition-colors"
										/>
										<span className="text-[10px] font-medium text-sub-text group-hover:text-theme-primary transition-colors">
											아이콘 업로드
										</span>
										<input
											type="file"
											className="hidden"
											accept="image/*"
											onChange={handleIconImageUpload}
										/>
									</label>
								)}
							</div>
						</div>
					</div>
				</Tabs>
				<div className="flex items-center justify-end gap-2 pt-4 border-t border-card/40">
					<Button variant="outline" onClick={cancelModal}>
						취소
					</Button>
					<Button onClick={handleAdd} disabled={!formData.name} className="px-8">
						추가하기
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
