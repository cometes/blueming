/* eslint-disable @next/next/no-img-element */
"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Trash2, ImagePlus, X } from "lucide-react";

export interface SubMenu {
	name: string;
	image: string;
}

export interface PendingImage {
	file: File;
	previewUrl: string;
}

interface MenuFolderTabProps {
	boardArr: { label: string; value: string }[];
	subMenus: (string | SubMenu)[];
	pendingSubMenuImages: Record<string, PendingImage>;
	onAddSubMenu: (boardName: string) => void;
	onRemoveSubMenu: (idx: number) => void;
	onSubMenuImageSelect: (file: File, name: string) => void;
	onClearSubMenuImage: (smName: string, idx: number) => void;
}

export default function MenuFolderTab({
	boardArr,
	subMenus,
	pendingSubMenuImages,
	onAddSubMenu,
	onRemoveSubMenu,
	onSubMenuImageSelect,
	onClearSubMenuImage,
}: MenuFolderTabProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<Label className="text-xs font-medium text-sub-text">하위 메뉴</Label>
				<Select onValueChange={(v) => onAddSubMenu(v)}>
					<SelectTrigger className="h-8 w-[140px] text-xs rounded-card border-card bg-card-bg">
						<SelectValue placeholder="추가하기" />
					</SelectTrigger>
					<SelectContent>
						{boardArr
							.filter(
								(board) =>
									!subMenus.some(
										(sm) =>
											(typeof sm === "string" ? sm : sm.name) === board.value
									)
							)
							.map((board) => (
								<SelectItem key={board.value} value={board.value}>
									{board.label}
								</SelectItem>
							))}
					</SelectContent>
				</Select>
			</div>
			{subMenus.length > 0 && (
				<div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
					{subMenus.map((sm, idx) => {
						const smName = typeof sm === "string" ? sm : sm.name;
						const smImage = typeof sm === "object" ? sm.image : "";
						const smPreview = pendingSubMenuImages[smName]?.previewUrl || smImage;
						return (
							<div
								key={idx}
								className="flex items-center justify-between bg-card-bg rounded-card p-2 border border-card"
							>
								<span className="text-sm font-medium flex-1">{smName}</span>
								<div className="flex items-center gap-2">
									{!smPreview && (
										<label className="cursor-pointer p-1.5 hover:bg-card-bg rounded-md text-sub-text hover:text-theme-primary transition-all">
											<ImagePlus size={16} />
											<input
												type="file"
												className="hidden"
												accept="image/*"
												onChange={(e) => {
													const file = e.target.files?.[0];
													if (file) onSubMenuImageSelect(file, smName);
													e.target.value = "";
												}}
											/>
										</label>
									)}
									<Button
										variant="ghost"
										size="icon"
										onClick={() => onRemoveSubMenu(idx)}
										className="h-8 w-8 text-sub-text hover:text-destructive"
									>
										<Trash2 size={16} />
									</Button>
									{smPreview && (
										<div className="relative w-[150px] max-h-9 rounded-card bg-theme-primary/10 border border-card overflow-hidden group">
											<img
												src={smPreview}
												alt="하위 메뉴 이미지"
												className="w-full h-full object-contain"
											/>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => onClearSubMenuImage(smName, idx)}
												className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-0"
												style={{ backgroundColor: "#111", color: "#fff" }}
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
			{subMenus.length === 0 && (
				<p className="text-xs text-sub-text text-center py-2">
					하위 메뉴를 추가해보세요
				</p>
			)}
		</div>
	);
}
