"use client";

import { ColorPicker } from "@/components/ui/color-picker";
import { ColorPalettePreview } from "@/components/ui/color-palette-preview";

interface SettingColorRowProps {
	label: string;
	value: string;
	onChange: (color: string) => void;
	/** 메인/서브 컬러처럼 파생 팔레트 미리보기가 필요한 행에서 사용 */
	showPalette?: boolean;
}

/** 설정 화면 공통의 컬러 선택 행: 라벨 + 컬러피커 + hex 값 (+ 팔레트 미리보기) */
export function SettingColorRow({
	label,
	value,
	onChange,
	showPalette = false,
}: SettingColorRowProps) {
	return (
		<div className="section-box flex items-center mt-4">
			<div className="text-box w-[220px]">
				<h3 className="font-medium text-sub-text">{label}</h3>
			</div>
			<div className="flex items-center gap-3">
				<ColorPicker value={value} onChange={onChange} />
				<span className="text-sm font-mono" style={{ color: value }}>
					{value}
				</span>
				{showPalette && <ColorPalettePreview color={value} />}
			</div>
		</div>
	);
}
