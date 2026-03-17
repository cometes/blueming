/* eslint-disable @next/next/no-img-element */
"use client";

import { Trash2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "@/components/ui/color-picker";
import RadioItem from "@/components/items/RadioItem";
import { useSettingDesign } from "@/hooks/useSettingDesign";
import { cn } from "@/shared/lib/utils";
import { Slider } from "@/components/ui/slider";

interface WidgetSettings {
	background: string;
	borderColor: string;
	borderRadius: number;
	borderStyle: string;
	borderWidth: number;
	blur: number;
	borderImage: string;
	borderImageType?: "full" | "corner";
}

interface CardSettings extends WidgetSettings {
	type: string;
	borderActiveColor: string;
	boxShadow: string;
	translateY: number;
}

interface WidgetSettingProps {
	widget: WidgetSettings;
	card: CardSettings;
	updateDesignSetting: (path: string, value: string | number) => void;
	pendingBorderImage?: File | null;
	onBorderImageSelect?: (file: File) => void;
	onOpenBorderImagePicker?: () => void;
	isUploading?: boolean;
}

const PRESET_TYPES = {
	LIGHT: "라이트",
	DARK: "다크",
	CUSTOM: "커스텀",
} as const;

export default function WidgetSetting({
	widget,
	card,
	updateDesignSetting,
	onBorderImageSelect,
	onOpenBorderImagePicker,
	isUploading = false,
}: WidgetSettingProps) {
	const { lightPreset, darkPreset, presetTypes, radiusTypes, lineTypes } =
		useSettingDesign();

	const applyPreset = (presetType: string) => {
		if (presetType === PRESET_TYPES.LIGHT) {
			Object.keys(lightPreset).forEach((key) => {
				updateDesignSetting(
					`card.${key}`,
					lightPreset[key as keyof typeof lightPreset]
				);
			});
			updateDesignSetting("card.type", presetType);
		} else if (presetType === PRESET_TYPES.DARK) {
			Object.keys(darkPreset).forEach((key) => {
				updateDesignSetting(
					`card.${key}`,
					darkPreset[key as keyof typeof darkPreset]
				);
			});
			updateDesignSetting("card.type", presetType);
		} else {
			updateDesignSetting("card.type", presetType);
		}
	};

	const getCardPreset = () => {
		if (card.type === PRESET_TYPES.LIGHT || card.type === PRESET_TYPES.DARK) {
			return card.type === PRESET_TYPES.LIGHT ? lightPreset : darkPreset;
		}
		return card;
	};

	const currentCardPreset = getCardPreset();

	return (
		<div className="space-y-8">
			{/* 위젯 설정 Section */}
			<section>
				<h2 className="text-[20px] font-semibold font-title">위젯 설정</h2>
				<div className="section-wrap mt-6">
					{/* 위젯 프리뷰 */}
					<div className="flex flex-col items-center p-8 rounded-card border-card bg-card-bg filter-blur-card mb-8 relative">
						<div
							className={cn(
								"relative z-10 flex items-center justify-center h-[100px] aspect-[3/1] bg-clip-padding transition-all",
								widget.borderImage &&
									widget.borderImageType === "corner" &&
									"border-corner-image"
							)}
							style={{
								borderStyle: widget.borderStyle,
								borderWidth: `${widget.borderWidth}px`,
								borderRadius: `${widget.borderRadius}px`,
								borderColor: widget.borderColor,
								backgroundColor: widget.background,
								backdropFilter: `blur(${widget.blur}px)`,
								...(widget.borderImage &&
									widget.borderImageType === "full" && {
										borderImage: `url("${widget.borderImage}") ${widget.borderWidth} fill`,
										borderImageSlice: widget.borderWidth,
									}),
								...(widget.borderImage &&
									widget.borderImageType === "corner" &&
									({
										"--corner-image": `url("${widget.borderImage}")`,
									} as React.CSSProperties)),
							}}
						>
							<p className="text-sub-text font-medium">위젯 프리뷰입니다.</p>
							{widget.borderImage && widget.borderImageType === "corner" && (
								<>
									<div
										className="absolute top-0 left-0 w-[30px] h-[30px] bg-no-repeat bg-contain"
										style={{
											backgroundImage: `url("${widget.borderImage}")`,
											backgroundPosition: "top left",
										}}
									/>
									<div
										className="absolute top-0 right-0 w-[30px] h-[30px] bg-no-repeat bg-contain"
										style={{
											backgroundImage: `url("${widget.borderImage}")`,
											backgroundPosition: "top right",
										}}
									/>
									<div
										className="absolute bottom-0 left-0 w-[30px] h-[30px] bg-no-repeat bg-contain"
										style={{
											backgroundImage: `url("${widget.borderImage}")`,
											backgroundPosition: "bottom left",
										}}
									/>
									<div
										className="absolute bottom-0 right-0 w-[30px] h-[30px] bg-no-repeat bg-contain"
										style={{
											backgroundImage: `url("${widget.borderImage}")`,
											backgroundPosition: "bottom right",
										}}
									/>
								</>
							)}
						</div>
						<img
							src="/꼬솜.png"
							alt="preview deco"
							className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
						/>
					</div>

					<div>
						{/* 위젯 배경 컬러 */}
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px] pr-5">
								<h3 className="font-medium text-sub-text">위젯 배경 컬러</h3>
							</div>
							<div className="flex items-center gap-3">
								<ColorPicker
									value={widget.background}
									onChange={(color) =>
										updateDesignSetting("widget.background", color)
									}
								/>
								<span
									className="text-sm font-mono"
									style={{ color: widget.background }}
								>
									{widget.background}
								</span>
							</div>
						</div>

						{/* 위젯 라인 컬러 */}
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px] pr-5">
								<h3 className="font-medium text-sub-text">위젯 라인 컬러</h3>
							</div>
							<div className="flex items-center gap-3">
								<ColorPicker
									value={widget.borderColor}
									onChange={(color) =>
										updateDesignSetting("widget.borderColor", color)
									}
								/>
								<span
									className="text-sm font-mono"
									style={{ color: widget.borderColor }}
								>
									{widget.borderColor}
								</span>
							</div>
						</div>

						{/* 위젯 모서리 둥글기 */}
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px] pr-5">
								<h3 className="font-medium text-sub-text">
									위젯 모서리 둥글기
								</h3>
							</div>
							<div className="flex items-center gap-4 flex-1 max-w-md w-full">
								<Slider
									min={0}
									max={15}
									step={1}
									value={[widget.borderRadius]}
									onValueChange={(val) =>
										updateDesignSetting("widget.borderRadius", val[0])
									}
									className="flex-1 min-w-[150px]"
								/>
								<Input
									type="number"
									min={0}
									max={15}
									value={widget.borderRadius}
									onChange={(e) =>
										updateDesignSetting(
											"widget.borderRadius",
											Number(e.target.value)
										)
									}
									className="w-20 rounded-card border-card bg-card-bg"
								/>
							</div>
						</div>

						{/* 위젯 라인 타입 */}
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px] pr-5">
								<h3 className="font-medium text-sub-text">위젯 라인 타입</h3>
							</div>
							<div className="grid grid-cols-4 gap-2 flex-1 max-w-sm">
								{lineTypes.map((el) => (
									<RadioItem
										key={el.value}
										onClickRadio={() =>
											updateDesignSetting("widget.borderStyle", el.value)
										}
										checked={widget.borderStyle === el.value}
										content={el.label}
										className="p-2"
									/>
								))}
							</div>
						</div>

						{/* 위젯 라인 굵기 */}
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px] pr-5">
								<h3 className="font-medium text-sub-text">위젯 라인 굵기</h3>
							</div>
							<div className="flex items-center gap-4 flex-1 max-w-md w-full">
								<Slider
									min={1}
									max={5}
									step={1}
									value={[widget.borderWidth]}
									onValueChange={(val) =>
										updateDesignSetting("widget.borderWidth", val[0])
									}
									className="flex-1 min-w-[150px]"
								/>
								<Input
									type="number"
									min={1}
									max={5}
									value={widget.borderWidth}
									onChange={(e) =>
										updateDesignSetting(
											"widget.borderWidth",
											Number(e.target.value)
										)
									}
									className="w-20 rounded-card border-card bg-card-bg"
								/>
							</div>
						</div>

						{/* 위젯 블러 */}
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px] pr-5">
								<h3 className="font-medium text-sub-text">위젯 블러</h3>
							</div>
							<div className="flex items-center gap-4 flex-1 max-w-md w-full">
								<Slider
									min={0}
									max={20}
									step={1}
									value={[widget.blur]}
									onValueChange={(val) =>
										updateDesignSetting("widget.blur", val[0])
									}
									className="flex-1 min-w-[150px]"
								/>
								<Input
									type="number"
									min={0}
									max={20}
									value={widget.blur}
									onChange={(e) =>
										updateDesignSetting("widget.blur", Number(e.target.value))
									}
									className="w-20 rounded-card border-card bg-card-bg"
								/>
							</div>
						</div>

						{/* 위젯 보더 이미지 */}
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px] pr-5">
								<h3 className="font-medium text-sub-text">
									위젯 보더 이미지 (옵션)
								</h3>
								<p className="text-xs text-sub-text-light mt-1">권장 90 * 90</p>
							</div>
							<div className="flex flex-col gap-3 flex-1">
								<div className="flex items-center gap-3">
									{onOpenBorderImagePicker ? (
										<button
											type="button"
											onClick={onOpenBorderImagePicker}
											className={`relative w-24 h-24 rounded-card border-card bg-card-bg overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-card-active transition-colors ${
												isUploading ? "opacity-60 pointer-events-none" : ""
											}`}
										>
											{widget.borderImage ? (
												<img
													src={widget.borderImage}
													alt="border"
													className="w-full h-full object-cover"
												/>
											) : (
												<>
													<ImagePlus
														size={28}
														color="#9BA2A8"
														absoluteStrokeWidth={true}
													/>
													<span className="text-[10px] text-gray-400">
														Upload Image
													</span>
												</>
											)}
										</button>
									) : (
										<label
											className={`relative w-24 h-24 rounded-card border-card bg-card-bg overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-card-active transition-colors ${
												isUploading ? "opacity-60 pointer-events-none" : ""
											}`}
										>
											{widget.borderImage ? (
												<img
													src={widget.borderImage}
													alt="border"
													className="w-full h-full object-cover"
												/>
											) : (
												<>
													<ImagePlus
														size={28}
														color="#9BA2A8"
														absoluteStrokeWidth={true}
													/>
													<span className="text-[10px] text-gray-400">
														Upload Image
													</span>
												</>
											)}
											<input
												type="file"
												accept="image/*"
												className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
												onChange={(event) => {
													const file = event.target.files?.[0];
													if (file) {
														onBorderImageSelect(file);
													}
													event.target.value = "";
												}}
											/>
										</label>
									)}
									{widget.borderImage && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												updateDesignSetting("widget.borderImage", "")
											}
											className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
											style={{
												transition: "all 0.3s ease-in-out",
											}}
										>
											<Trash2 size={14} className="mr-2" />
											비우기
										</Button>
									)}
								</div>
								{widget.borderImage && (
									<div className="flex items-center gap-3">
										<span className="text-sm text-sub-text min-w-[100px]">
											적용 방식:
										</span>
										<div className="grid grid-cols-2 gap-2 ">
											<RadioItem
												onClickRadio={() =>
													updateDesignSetting("widget.borderImageType", "full")
												}
												checked={
													widget.borderImageType === "full" ||
													!widget.borderImageType
												}
												content="전체"
												className="p-2"
											/>
											<RadioItem
												onClickRadio={() =>
													updateDesignSetting(
														"widget.borderImageType",
														"corner"
													)
												}
												checked={widget.borderImageType === "corner"}
												content="코너만"
												className="p-2"
											/>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</section>

			<Separator className="my-12" />

			{/* 카드 설정 Section */}
			<section>
				<h2 className="text-[20px] font-semibold font-title">카드 설정</h2>
				<div className="section-wrap mt-6">
					{/* 카드 프리뷰 */}
					<div className="flex flex-col items-center p-8 rounded-card border-card bg-card-bg filter-blur-card mb-8 relative">
						<div
							className="relative z-10 flex items-center justify-center h-[100px] aspect-[3/1] transition-all hover:-translate-y-1 hover:shadow-lg"
							style={{
								borderStyle: currentCardPreset.borderStyle,
								borderWidth: `${currentCardPreset.borderWidth}px`,
								borderRadius: `${currentCardPreset.borderRadius}px`,
								borderColor: currentCardPreset.borderColor,
								backgroundColor: currentCardPreset.background,
								backdropFilter: `blur(${currentCardPreset.blur}px)`,
								boxShadow:
									card.type !== PRESET_TYPES.CUSTOM
										? currentCardPreset.boxShadow
										: undefined,
								transform: `translateY(${currentCardPreset.translateY}px)`,
							}}
						>
							<p
								className={cn(
									"font-medium",
									card.type === "다크" ? "text-white" : "text-sub-text"
								)}
							>
								카드 프리뷰입니다.
							</p>
						</div>
						<img
							src="/꼬솜.png"
							alt="preview deco"
							className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
						/>
					</div>

					<div>
						{/* 프리셋 */}
						<div className="section-box flex items-center my-4">
							<div className="text-box w-[220px] pr-5">
								<h3 className="font-medium text-sub-text">프리셋</h3>
							</div>
							<div className="grid grid-cols-3 gap-3 flex-1 max-w-sm">
								{presetTypes.map((el) => (
									<RadioItem
										key={el}
										onClickRadio={() => applyPreset(el)}
										checked={card.type === el}
										content={el}
									/>
								))}
							</div>
						</div>

						{card.type === PRESET_TYPES.CUSTOM && (
							<div className="pt-4 border-t border-solid">
								{/* 카드 배경 컬러 */}
								<div className="section-box flex items-center mt-4">
									<div className="text-box w-[220px] pr-5">
										<h3 className="font-medium text-sub-text">
											카드 배경 컬러
										</h3>
									</div>
									<div className="flex items-center gap-3">
										<ColorPicker
											value={card.background}
											onChange={(color) =>
												updateDesignSetting("card.background", color)
											}
										/>
										<span
											className="text-sm font-mono"
											style={{ color: card.background }}
										>
											{card.background}
										</span>
									</div>
								</div>

								{/* 카드 라인 컬러 */}
								<div className="section-box flex items-center mt-4">
									<div className="text-box w-[220px] pr-5">
										<h3 className="font-medium text-sub-text">
											카드 라인 컬러
										</h3>
									</div>
									<div className="flex items-center gap-6">
										<div className="flex items-center gap-2">
											<ColorPicker
												value={card.borderColor}
												onChange={(color) =>
													updateDesignSetting("card.borderColor", color)
												}
											/>
											<span className="text-xs text-sub-text">기본</span>
										</div>
										<div className="flex items-center gap-2">
											<ColorPicker
												value={card.borderActiveColor}
												onChange={(color) =>
													updateDesignSetting("card.borderActiveColor", color)
												}
											/>
											<span className="text-xs text-sub-text">활성</span>
										</div>
									</div>
								</div>

								{/* 카드 모서리 둥글기 */}
								<div className="section-box flex items-center mt-4">
									<div className="text-box w-[220px] pr-5">
										<h3 className="font-medium text-sub-text">
											카드 모서리 둥글기
										</h3>
									</div>
									<div className="grid grid-cols-4 gap-2 flex-1 max-w-sm">
										{radiusTypes.map((el) => (
											<RadioItem
												key={el}
												onClickRadio={() =>
													updateDesignSetting("card.borderRadius", el)
												}
												checked={card.borderRadius === el}
												content={`${el}px`}
												className="p-2"
											/>
										))}
									</div>
								</div>

								{/* 카드 라인 타입 */}
								<div className="section-box flex items-center mt-4">
									<div className="text-box w-[220px] pr-5">
										<h3 className="font-medium text-sub-text">
											카드 라인 타입
										</h3>
									</div>
									<div className="grid grid-cols-4 gap-2 flex-1 max-w-sm">
										{lineTypes.map((el) => (
											<RadioItem
												key={el.value}
												onClickRadio={() =>
													updateDesignSetting("card.borderStyle", el.value)
												}
												checked={card.borderStyle === el.value}
												content={el.label}
												className="p-2"
											/>
										))}
									</div>
								</div>

								{/* 카드 라인 굵기 */}
								<div className="section-box flex items-center mt-4">
									<div className="text-box w-[220px] pr-5">
										<h3 className="font-medium text-sub-text">
											카드 라인 굵기
										</h3>
									</div>
									<div className="flex items-center gap-4 flex-1 max-w-md w-full">
										<Slider
											min={1}
											max={5}
											step={1}
											value={[card.borderWidth]}
											onValueChange={(val) =>
												updateDesignSetting("card.borderWidth", val[0])
											}
											className="flex-1 min-w-[150px]"
										/>
										<Input
											type="number"
											min={1}
											max={5}
											value={card.borderWidth}
											onChange={(e) =>
												updateDesignSetting(
													"card.borderWidth",
													Number(e.target.value)
												)
											}
											className="w-20 rounded-card border-card bg-card-bg"
										/>
									</div>
								</div>

								{/* 카드 블러 */}
								<div className="section-box flex items-center mt-4">
									<div className="text-box w-[220px] pr-5">
										<h3 className="font-medium text-sub-text">카드 블러</h3>
									</div>
									<div className="flex items-center gap-4 flex-1 max-w-md w-full">
										<Slider
											min={0}
											max={20}
											step={1}
											value={[card.blur]}
											onValueChange={(val) =>
												updateDesignSetting("card.blur", val[0])
											}
											className="flex-1 min-w-[150px]"
										/>
										<Input
											type="number"
											min={0}
											max={20}
											value={card.blur}
											onChange={(e) =>
												updateDesignSetting("card.blur", Number(e.target.value))
											}
											className="w-20 rounded-card border-card bg-card-bg"
										/>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}
