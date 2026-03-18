/* eslint-disable @next/next/no-img-element */
"use client";

import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import RadioItem from "@/components/items/RadioItem";
import { cn } from "@/shared/lib/utils";
import { Slider } from "@/components/ui/slider";
import type { CardSettings } from "./types";

const PRESET_TYPES = {
	LIGHT: "라이트",
	DARK: "다크",
	CUSTOM: "커스텀",
} as const;

interface CardPreset {
	borderStyle: string;
	borderRadius: number;
	borderWidth: number;
	borderColor: string;
	borderActiveColor: string;
	background: string;
	blur: number;
	boxShadow: string;
	translateY: number;
}

interface CardSectionProps {
	card: CardSettings;
	presetTypes: string[];
	radiusTypes: number[];
	lineTypes: { label: string; value: string }[];
	lightPreset: CardPreset;
	darkPreset: CardPreset;
	updateDesignSetting: (path: string, value: string | number) => void;
}

export default function CardSection({
	card,
	presetTypes,
	radiusTypes,
	lineTypes,
	lightPreset,
	darkPreset,
	updateDesignSetting,
}: CardSectionProps) {
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
	);
}
