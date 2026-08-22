"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SettingColorRow } from "@/features/settings/components/SettingColorRow";
import type { FontDesign } from "@/features/settings/types";

const FONT_SAMPLE_TEXTS = {
	TITLE: "제목 또는 메뉴명 Title",
	CONTENT: "본문 서체 및 크기 미리보기 기본 문장 12345 Paragraph",
	DESCRIPTION: "서브 폰트 미리보기 12345 Description",
} as const;

interface FontOption {
	label?: string;
	value?: string;
}

interface FontSettingSectionProps {
	font: FontDesign;
	fontTitle: FontOption[];
	fontBody: FontOption[];
	onUpdate: (path: string, value: string) => void;
	onOpenFontDialog: () => void;
}

/** 디자인 설정의 폰트 섹션: 미리보기 + 컬러 2종 + 서체 2종 + 폰트 등록 버튼 */
export function FontSettingSection({
	font,
	fontTitle,
	fontBody,
	onUpdate,
	onOpenFontDialog,
}: FontSettingSectionProps) {
	return (
		<section>
			<div className="flex items-center justify-between">
				<h2 className="text-[20px] font-semibold font-title">폰트 설정</h2>
				<Button
					type="button"
					variant="outline"
					onClick={onOpenFontDialog}
					className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
					style={{ transition: "all 0.3s ease-in-out" }}
				>
					<Plus size={14} className="mr-2" />
					폰트 등록
				</Button>
			</div>
			<div className="section-wrap mt-6">
				{/* Font Preview */}
				<div className="font-sample-wrap flex flex-col items-center p-7 rounded-card border-card bg-card-bg filter-blur-card mt-4">
					<h3
						className="text-3xl font-bold"
						style={{
							fontFamily: font.titleFontFamily,
							color: font.mainFontColor,
						}}
					>
						{FONT_SAMPLE_TEXTS.TITLE}
					</h3>
					<p
						className="text-base"
						style={{
							fontFamily: font.bodyFontFamily,
							color: font.mainFontColor,
						}}
					>
						{FONT_SAMPLE_TEXTS.CONTENT}
					</p>
					<p
						className="text-sm"
						style={{
							fontFamily: font.bodyFontFamily,
							color: font.subFontColor,
						}}
					>
						{FONT_SAMPLE_TEXTS.DESCRIPTION}
					</p>
				</div>

				<SettingColorRow
					label="메인 폰트 컬러"
					value={font.mainFontColor ?? ""}
					onChange={(color) => onUpdate("font.mainFontColor", color)}
				/>

				<SettingColorRow
					label="서브 폰트 컬러"
					value={font.subFontColor ?? ""}
					onChange={(color) => onUpdate("font.subFontColor", color)}
				/>

				{/* 제목 서체 */}
				<div className="section-box flex items-center mt-4">
					<div className="text-box w-[220px]">
						<h3 className="font-medium text-sub-text">제목 서체</h3>
					</div>
					<Select
						value={font.titleFontFamily ?? ""}
						onValueChange={(value: string) =>
							onUpdate("font.titleFontFamily", value)
						}
					>
						<SelectTrigger className="w-[200px] rounded-card border-card bg-card-bg">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{fontTitle.map((item) => (
								<SelectItem key={item.value ?? ""} value={item.value ?? ""}>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* 본문 서체 */}
				<div className="section-box flex items-center mt-4">
					<div className="text-box w-[220px]">
						<h3 className="font-medium text-sub-text">본문 서체</h3>
					</div>
					<Select
						value={font.bodyFontFamily ?? ""}
						onValueChange={(value: string) =>
							onUpdate("font.bodyFontFamily", value)
						}
					>
						<SelectTrigger className="w-[200px] rounded-card border-card bg-card-bg">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{fontBody.map((item) => (
								<SelectItem key={item.value ?? ""} value={item.value ?? ""}>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</section>
	);
}
