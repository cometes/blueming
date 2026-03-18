/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { ImagePlus, X } from "lucide-react";
import type { CreateMetaValue } from "@/features/library/components/CreateModal";

interface CreateModalLeftPanelProps {
	value: CreateMetaValue;
	onChange: (next: CreateMetaValue) => void;
	onOpenThumbnailDialog: () => void;
	onOpenBackgroundDialog: () => void;
}

export default function CreateModalLeftPanel({
	value,
	onChange,
	onOpenThumbnailDialog,
	onOpenBackgroundDialog,
}: CreateModalLeftPanelProps) {
	return (
		<div className="w-full md:w-1/2">
			<h3 className="text-2xl font-semibold text-main-text mb-4 font-title">
				포스트 미리보기
			</h3>
			<section className="space-y-4">
				<div className="rounded-card flex flex-col items-center gap-4">
					{value.thumbnail ? (
						<div className="relative w-full aspect-[2/1] overflow-hidden rounded-card border border-card">
							<img
								src={value.thumbnail}
								alt="썸네일 미리보기"
								className="w-full h-full object-cover"
							/>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white"
								onClick={() =>
									onChange({
										...value,
										thumbnail: "",
									})
								}
							>
								<X size={16} />
							</Button>
						</div>
					) : (
						<button
							type="button"
							onClick={onOpenThumbnailDialog}
							className="w-full aspect-[2/1] border border-dashed border-card text-sub-text rounded-card flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-theme-primary/60 transition-colors"
						>
							<ImagePlus size={40} className="text-sub-text" />
							<span className="text-sm text-theme-primary">썸네일 업로드</span>
						</button>
					)}
				</div>
				<div>
					<h4 className="text-lg font-semibold text-main-text mb-3 font-title">
						배경 설정
					</h4>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() =>
								onChange({
									...value,
									backgroundType: "default",
								})
							}
							className={cn(
								"flex-1 h-9 rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10",
								(value.backgroundType ?? "default") === "default"
									? "bg-theme-primary text-white border-2 border-theme-primary"
									: "border-2 border-card",
							)}
							style={{ transition: "all 0.3s ease-in-out" }}
						>
							기본
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								onChange({
									...value,
									backgroundType: "color",
									backgroundColor: value.backgroundColor?.trim() || "#fff",
								});
							}}
							className={cn(
								"flex-1 h-9 rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10",
								value.backgroundType === "color"
									? "bg-theme-primary text-white border-2 border-theme-primary"
									: "border-2 border-card",
							)}
							style={{ transition: "all 0.3s ease-in-out" }}
						>
							색상
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() =>
								onChange({
									...value,
									backgroundType: "image",
								})
							}
							className={cn(
								"flex-1 h-9 rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10",
								value.backgroundType === "image"
									? "bg-theme-primary text-white border-2 border-theme-primary"
									: "border-2 border-card",
							)}
							style={{ transition: "all 0.3s ease-in-out" }}
						>
							이미지
						</Button>
					</div>

					{value.backgroundType === "color" && (
						<div className="mt-4 flex items-center gap-3">
							<ColorPicker
								value={value.backgroundColor || "#fff"}
								onChange={(nextColor) =>
									onChange({
										...value,
										backgroundColor: nextColor,
									})
								}
								className="h-9 w-10"
							/>
							<Input
								type="text"
								placeholder="#fff"
								value={value.backgroundColor ?? ""}
								onChange={(event) =>
									onChange({
										...value,
										backgroundColor: event.target.value,
									})
								}
								className="bg-card border-card rounded-card"
							/>
						</div>
					)}

					{value.backgroundType === "image" && (
						<div className="mt-4 space-y-3">
							{value.backgroundImage ? (
								<div className="relative w-full aspect-[2/1] overflow-hidden rounded-card border border-card">
									<img
										src={value.backgroundImage}
										alt="배경 이미지 미리보기"
										className="w-full h-full object-cover"
									/>
									<Button
										type="button"
										size="icon"
										variant="ghost"
										className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white"
										onClick={() =>
											onChange({
												...value,
												backgroundImage: "",
											})
										}
									>
										<X size={16} />
									</Button>
								</div>
							) : (
								<button
									type="button"
									onClick={onOpenBackgroundDialog}
									className="w-full aspect-[2/1] border border-dashed border-card text-sub-text rounded-card flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-theme-primary/60 transition-colors"
								>
									<ImagePlus size={36} className="text-sub-text" />
									<span className="text-sm text-theme-primary">
										배경 이미지 업로드
									</span>
								</button>
							)}
						</div>
					)}

					<label className="inline-flex items-center gap-2 text-sm text-sub-text mt-4">
						<Checkbox
							checked={value.enableBackdrop !== false}
							onCheckedChange={(checked) =>
								onChange({
									...value,
									enableBackdrop: checked === true,
								})
							}
							className="data-[state=checked]:bg-theme-primary data-[state=checked]:border-theme-primary border-card"
						/>
						비침 방지
					</label>
				</div>
				<label className="inline-flex items-center gap-2 text-sm text-sub-text">
					<Checkbox
						checked={value.pinned === true}
						onCheckedChange={(checked) =>
							onChange({
								...value,
								pinned: checked === true,
							})
						}
						className="data-[state=checked]:bg-theme-primary data-[state=checked]:border-theme-primary border-card"
					/>
					공지로 설정
				</label>
			</section>
		</div>
	);
}
