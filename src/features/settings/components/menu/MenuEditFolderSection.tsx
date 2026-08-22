/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ImagePlus, Trash2, X } from "lucide-react";
import type { SubMenu } from "@/features/settings/types";

interface MenuEditFolderSectionProps {
	boardArr: { label: string; value: string }[];
	subMenus: (string | SubMenu)[];
	onAddSubMenu: (boardName: string) => void;
	onRemoveSubMenu: (idx: number) => void;
	onUploadImage: (file: File, idx: number) => void;
	onClearImage: (idx: number) => void;
}

/** 메뉴 수정 모달의 폴더 타입 하위 메뉴 관리 섹션 (이미지 즉시 업로드 방식) */
export default function MenuEditFolderSection({
	boardArr,
	subMenus,
	onAddSubMenu,
	onRemoveSubMenu,
	onUploadImage,
	onClearImage,
}: MenuEditFolderSectionProps) {
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
											(typeof sm === "string" ? sm : sm.name) === board.value,
									),
							)
							.map((board) => (
								<SelectItem key={board.value} value={board.value}>
									{board.label}
								</SelectItem>
							))}
					</SelectContent>
				</Select>
			</div>
			<div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
				{subMenus.map((sm, idx) => {
					const smName = typeof sm === "string" ? sm : sm.name;
					const smImage = typeof sm === "object" ? sm.image : "";
					return (
						<div
							key={idx}
							className="flex items-center justify-between bg-card-bg rounded-card p-2 border border-card"
						>
							<span className="text-sm font-medium flex-1">{smName}</span>
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
												if (file) onUploadImage(file, idx);
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
											onClick={() => onClearImage(idx)}
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
		</div>
	);
}
