"use client";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SettingColorRow } from "@/features/settings/components/SettingColorRow";

const INPUT_HEIGHT = "h-9";

interface LogoTextSettingsProps {
	logoText: string;
	logoTextValue: string;
	logoTextError?: string;
	logoFontFamily?: string;
	logoFontWeight?: string;
	logoColor?: string;
	fontTitle: { label: string; value: string }[];
	onLogoTextChange: (value: string) => void;
	onFontFamilyChange: (value: string) => void;
	onFontWeightChange: (value: string) => void;
	onColorChange: (color: string) => void;
}

/** 일반 설정의 텍스트 로고 편집: 미리보기 + 타이틀/서체/굵기/컬러 */
export function LogoTextSettings({
	logoText,
	logoTextValue,
	logoTextError,
	logoFontFamily,
	logoFontWeight,
	logoColor,
	fontTitle,
	onLogoTextChange,
	onFontFamilyChange,
	onFontWeightChange,
	onColorChange,
}: LogoTextSettingsProps) {
	return (
		<>
			{/* 미리보기 */}
			<div className="flex flex-col items-center p-8 rounded-card border-card bg-card-bg filter-blur-card mt-6 mb-2">
				<div className="flex items-center justify-center h-[80px] px-8">
					<span
						style={{
							fontFamily: logoFontFamily || undefined,
							fontWeight: logoFontWeight || "700",
							color: logoColor || undefined,
							fontSize: "1.5rem",
						}}
					>
						{logoText || "로고 타이틀"}
					</span>
				</div>
			</div>

			{/* 로고 타이틀 텍스트 */}
			<div className="section-box flex items-center mt-4">
				<div className="text-box w-[220px] pr-5 relative">
					<h3 className="font-medium text-sub-text">로고 타이틀</h3>
					{logoTextError && (
						<p className="text-sm absolute left-1 top-full text-red-500 mt-1">
							{logoTextError}
						</p>
					)}
				</div>
				<div className="input-box relative w-calc(100% - 220px) flex-1">
					<Input
						placeholder="로고 타이틀을 입력해주세요"
						value={logoTextValue}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							onLogoTextChange(e.target.value)
						}
						className={
							INPUT_HEIGHT +
							" rounded-card border-card focus:border-card-active bg-card-bg"
						}
					/>
				</div>
			</div>

			{/* 폰트 스타일 */}
			<div className="section-box flex items-center mt-4">
				<div className="text-box w-[220px] pr-5">
					<h3 className="font-medium text-sub-text">폰트 스타일</h3>
				</div>
				<div className="w-[200px]">
					<Select value={logoFontFamily || ""} onValueChange={onFontFamilyChange}>
						<SelectTrigger
							className={INPUT_HEIGHT + " rounded-card border-card bg-card-bg"}
						>
							<SelectValue placeholder="기본 폰트" />
						</SelectTrigger>
						<SelectContent>
							{fontTitle.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									<span style={{ fontFamily: item.value }}>{item.label}</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* 폰트 굵기 */}
			<div className="section-box flex items-center mt-4">
				<div className="text-box w-[220px] pr-5">
					<h3 className="font-medium text-sub-text">폰트 굵기</h3>
				</div>
				<div className="flex items-center gap-4 flex-1 max-w-md w-full">
					<Slider
						min={100}
						max={900}
						step={100}
						value={[Number(logoFontWeight) || 700]}
						onValueChange={(val) => onFontWeightChange(String(val[0]))}
						className="flex-1 min-w-[150px]"
					/>
					<Input
						type="number"
						min={100}
						max={900}
						step={100}
						value={Number(logoFontWeight) || 700}
						onChange={(e) => onFontWeightChange(e.target.value)}
						className="w-20 rounded-card border-card bg-card-bg"
					/>
				</div>
			</div>

			{/* 폰트 컬러 */}
			<SettingColorRow
				label="폰트 컬러"
				value={logoColor || "#000000"}
				onChange={onColorChange}
			/>
		</>
	);
}
