"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Grid3X3,
	LayoutGrid,
	Square,
	RectangleHorizontal,
	RectangleVertical,
	Image as ImageIcon,
	ArrowDownAZ,
	ArrowUpAZ,
	MessageSquare,
	Link,
} from "lucide-react";
import type { GallerySettings } from "@/types/gallery";
import { DEFAULT_GALLERY_SETTINGS } from "@/types/gallery";

interface GallerySettingsDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	settings?: GallerySettings;
	onSave: (settings: GallerySettings) => void;
	trigger: React.ReactNode;
}

export default function GallerySettingsDialog({
	isOpen,
	onOpenChange,
	settings = DEFAULT_GALLERY_SETTINGS,
	onSave,
	trigger,
}: GallerySettingsDialogProps) {
	const [tempSettings, setTempSettings] = useState<GallerySettings>(settings);

	useEffect(() => {
		if (isOpen) {
			setTempSettings(settings);
		}
	}, [isOpen, settings]);

	const handleSave = () => {
		onSave(tempSettings);
		onOpenChange(false);
	};

	const updateOptions = (
		key: keyof GallerySettings["options"],
		value: GallerySettings["options"][typeof key]
	) => {
		setTempSettings((prev) => ({
			...prev,
			options: {
				...prev.options,
				[key]: value,
			},
		}));
	};

	const updateBehavior = (
		key: keyof GallerySettings["behavior"],
		value: GallerySettings["behavior"][typeof key]
	) => {
		setTempSettings((prev) => ({
			...prev,
			behavior: {
				...prev.behavior,
				[key]: value,
			},
		}));
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent
				showCloseButton={false}
				className="bg-card border-card rounded-card backdrop-blur-card p-0 max-w-lg"
			>
				<DialogHeader className="gap-0">
					<DialogTitle className="border-b border-card-border px-5 py-4 text-main-text flex items-center justify-between">
						<p className="font-title">갤러리 설정</p>
						<Button onClick={handleSave}>저장하기</Button>
					</DialogTitle>
					<div className="px-5 py-4 text-main-text space-y-6">
						{/* 레이아웃 선택 */}
						<div>
							<Label className="text-sm font-medium">레이아웃</Label>
							<div className="flex gap-2 mt-2">
								<Button
									variant={
										tempSettings.layout === "grid" ? "default" : "ghost"
									}
									onClick={() =>
										setTempSettings((prev) => ({ ...prev, layout: "grid" }))
									}
									className="flex-1"
								>
									<Grid3X3 className="mr-2 h-4 w-4" /> 그리드
								</Button>
								<Button
									variant={
										tempSettings.layout === "masonry" ? "default" : "ghost"
									}
									onClick={() =>
										setTempSettings((prev) => ({ ...prev, layout: "masonry" }))
									}
									className="flex-1"
								>
									<LayoutGrid className="mr-2 h-4 w-4" /> 메이슨리
								</Button>
							</div>
						</div>

						{/* 컬럼 수 */}
						<div>
							<Label className="text-sm font-medium">
								컬럼 수 (데스크탑 기준)
							</Label>
							<div className="flex gap-1 mt-2">
								{[2, 3, 4, 5, 6].map((col) => (
									<Button
										key={col}
										variant={
											tempSettings.options.columns === col ? "default" : "ghost"
										}
										onClick={() => updateOptions("columns", col)}
										className="flex-1 px-3"
									>
										{col}
									</Button>
								))}
							</div>
							<p className="text-xs text-sub-text mt-1">
								모바일/태블릿은 자동으로 조정됩니다
							</p>
						</div>

						{/* 간격 */}
						<div>
							<Label className="text-sm font-medium">간격 (px)</Label>
							<div className="flex gap-1 mt-2">
								{[8, 12, 16, 20, 24].map((gap) => (
									<Button
										key={gap}
										variant={
											tempSettings.options.gap === gap ? "default" : "ghost"
										}
										onClick={() => updateOptions("gap", gap)}
										className="flex-1 px-3"
									>
										{gap}
									</Button>
								))}
							</div>
						</div>

						{/* 이미지 비율 - 그리드에서만 표시 */}
						{tempSettings.layout === "grid" && (
							<div>
								<Label className="text-sm font-medium">이미지 비율</Label>
								<div className="flex gap-1 mt-2 flex-wrap">
									<RatioButton
										label="1:1"
										icon={<Square className="h-4 w-4" />}
										selected={tempSettings.options.imageRatio === "square"}
										onClick={() => updateOptions("imageRatio", "square")}
									/>
									<RatioButton
										label="16:9"
										icon={<RectangleHorizontal className="h-4 w-4" />}
										selected={tempSettings.options.imageRatio === "landscape"}
										onClick={() => updateOptions("imageRatio", "landscape")}
									/>
									<RatioButton
										label="3:4"
										icon={<RectangleVertical className="h-4 w-4" />}
										selected={tempSettings.options.imageRatio === "portrait"}
										onClick={() => updateOptions("imageRatio", "portrait")}
									/>
									<RatioButton
										label="원본"
										icon={<ImageIcon className="h-4 w-4" />}
										selected={tempSettings.options.imageRatio === "original"}
										onClick={() => updateOptions("imageRatio", "original")}
									/>
								</div>
							</div>
						)}

						{/* 정렬 순서 */}
						<div>
							<Label className="text-sm font-medium">정렬 순서</Label>
							<div className="flex gap-2 mt-2">
								<Button
									variant={
										tempSettings.behavior.sortOrder === "latest"
											? "default"
											: "ghost"
									}
									onClick={() => updateBehavior("sortOrder", "latest")}
									className="flex-1"
								>
									<ArrowDownAZ className="mr-2 h-4 w-4" /> 최신순
								</Button>
								<Button
									variant={
										tempSettings.behavior.sortOrder === "oldest"
											? "default"
											: "ghost"
									}
									onClick={() => updateBehavior("sortOrder", "oldest")}
									className="flex-1"
								>
									<ArrowUpAZ className="mr-2 h-4 w-4" /> 오래된순
								</Button>
							</div>
						</div>

						{/* 토글 옵션들 */}
						<div className="space-y-4 pt-2 border-t border-card-border">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<MessageSquare className="h-4 w-4 text-sub-text" />
									<Label htmlFor="showCaption" className="text-sm">
										캡션 표시
									</Label>
								</div>
								<Switch
									id="showCaption"
									checked={tempSettings.options.showCaption}
									onCheckedChange={(checked) =>
										updateOptions("showCaption", checked)
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Link className="h-4 w-4 text-sub-text" />
									<Label htmlFor="enableDeepLink" className="text-sm">
										딥링크 활성화
									</Label>
								</div>
								<Switch
									id="enableDeepLink"
									checked={tempSettings.behavior.enableDeepLink}
									onCheckedChange={(checked) =>
										updateBehavior("enableDeepLink", checked)
									}
								/>
							</div>
						</div>
					</div>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}

// 비율 버튼 컴포넌트
function RatioButton({
	label,
	icon,
	selected,
	onClick,
}: {
	label: string;
	icon: React.ReactNode;
	selected: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			variant={selected ? "default" : "ghost"}
			onClick={onClick}
			className="flex-1 min-w-[70px]"
		>
			{icon}
			<span className="ml-1">{label}</span>
		</Button>
	);
}
