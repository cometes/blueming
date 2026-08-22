/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface MenuImageUploadFieldProps {
	label: string;
	hint: string;
	uploadLabel: string;
	/** banner: 220*80 메뉴 이미지, icon: 64*64 아이콘 이미지 */
	variant: "banner" | "icon";
	previewUrl?: string;
	onOpenPicker: () => void;
	onClear: () => void;
}

/** 메뉴 추가/수정 모달 공통의 이미지 업로드 블록 (미리보기 + 제거, 또는 업로드 버튼) */
export default function MenuImageUploadField({
	label,
	hint,
	uploadLabel,
	variant,
	previewUrl,
	onOpenPicker,
	onClear,
}: MenuImageUploadFieldProps) {
	const isBanner = variant === "banner";

	return (
		<>
			<Label className="text-xs font-medium text-sub-text">{label}</Label>
			<div className="p-3 bg-card-bg rounded-card border border-dashed border-card">
				<p className="text-[10px] text-sub-text mb-2">{hint}</p>
				{previewUrl ? (
					<div
						className={cn(
							"relative rounded-card border border-card overflow-hidden bg-card-bg group min-h-[68px]",
							isBanner
								? "aspect-[22/8] w-full max-w-[280px]"
								: "aspect-square w-16",
						)}
					>
						<img
							src={previewUrl}
							alt={label}
							className="w-full h-full object-contain"
						/>
						<Button
							variant="ghost"
							size="icon"
							onClick={onClear}
							className={cn(
								"absolute rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-0",
								isBanner
									? "top-1 right-1 h-5 w-5"
									: "top-0.5 right-0.5 h-4 w-4",
							)}
							style={{ backgroundColor: "#111", color: "#fff" }}
						>
							<X size={isBanner ? 12 : 10} />
						</Button>
					</div>
				) : (
					<button
						type="button"
						onClick={onOpenPicker}
						className="flex flex-col items-center justify-center h-[68px] w-full cursor-pointer bg-card-bg hover:bg-card-bg/70 border border-dashed border-card rounded-card transition-all gap-1.5 group"
					>
						<ImagePlus
							size={20}
							className="text-sub-text group-hover:text-theme-primary transition-colors"
						/>
						<span className="text-[11px] font-medium text-sub-text group-hover:text-theme-primary transition-colors">
							{uploadLabel}
						</span>
					</button>
				)}
			</div>
		</>
	);
}
