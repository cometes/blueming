/* eslint-disable @next/next/no-img-element */
"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import RadioItem from "@/components/items/RadioItem";
import { SettingColorRow } from "@/features/settings/components/SettingColorRow";
import type { BackgroundDesign } from "@/features/settings/types";

const BACKGROUND_TYPES = {
	IMAGE: "이미지",
	SOLID: "단색",
	GRADIENT: "그라데이션",
} as const;

const ICON_SIZE = 28;
const ICON_COLOR = "#9BA2A8";

interface BackgroundSettingSectionProps {
	BGTypes: string[];
	background: BackgroundDesign;
	pendingPreviewUrl?: string;
	isUploading: boolean;
	onUpdate: (path: string, value: string) => void;
	onOpenImagePicker: () => void;
	onClearImage: () => void;
}

/** 디자인 설정의 배경 섹션: 타입 선택 + (이미지 업로드 | 단색 컬러) */
export function BackgroundSettingSection({
	BGTypes,
	background,
	pendingPreviewUrl,
	isUploading,
	onUpdate,
	onOpenImagePicker,
	onClearImage,
}: BackgroundSettingSectionProps) {
	return (
		<section>
			<h2 className="text-[20px] font-semibold font-title">배경 디자인 설정</h2>
			<div className="section-wrap mt-6">
				{/* 배경 타입 */}
				<div className="section-box flex items-center mt-4">
					<div className="text-box w-[220px] pr-5">
						<h3 className="font-medium text-sub-text">배경 타입</h3>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
						{BGTypes.map((el) => (
							<RadioItem
								key={el}
								onClickRadio={() => {
									onUpdate("background.type", el);
								}}
								checked={background.type === el}
								content={el}
							/>
						))}
					</div>
				</div>

				{/* 배경 이미지 */}
				{background.type === BACKGROUND_TYPES.IMAGE && (
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">배경 이미지</h3>
						</div>
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={onOpenImagePicker}
								className={`relative w-3xs max-h-32 aspect-video rounded-card border-card bg-card-bg overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-card-active transition-colors ${
									isUploading ? "opacity-60 pointer-events-none" : ""
								}`}
							>
								{pendingPreviewUrl || background.image ? (
									<img
										src={pendingPreviewUrl || background.image}
										alt="배경 이미지"
										className="w-full h-full object-contain"
									/>
								) : (
									<>
										<ImagePlus
											size={ICON_SIZE}
											color={ICON_COLOR}
											absoluteStrokeWidth={true}
										/>
										<span className="text-xs text-gray-500 dark:text-gray-400">
											이미지 업로드
										</span>
									</>
								)}
							</button>
							{(pendingPreviewUrl || background.image) && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={onClearImage}
									className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
									style={{ transition: "all 0.3s ease-in-out" }}
								>
									<Trash2
										size={14}
										className="mr-2"
										style={{ transition: "all 0.3s ease-in-out" }}
									/>
									비우기
								</Button>
							)}
						</div>
					</div>
				)}

				{/* 단색 배경 */}
				{background.type === BACKGROUND_TYPES.SOLID && (
					<SettingColorRow
						label="배경 컬러"
						value={background.color ?? ""}
						onChange={(color) => onUpdate("background.color", color)}
					/>
				)}
			</div>
		</section>
	);
}
