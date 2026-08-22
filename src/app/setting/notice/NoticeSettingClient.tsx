"use client";

import { EditorContent } from "@tiptap/react";
import EditorImageDropZone from "@/components/editor/EditorImageDropZone";
import UrlPasteMenu from "@/components/editor/UrlPasteMenu";
import BlockDropIndicator from "@/components/editor/BlockDropIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ColorPicker } from "@/components/ui/color-picker";
import RadioItem from "@/components/items/RadioItem";
import { Slider } from "@/components/ui/slider";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import TiptapToolbar from "@/components/tiptap/TiptapToolbar";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { Save } from "lucide-react";
import {
	GRADIENT_SETTINGS,
	MARQUEE_TYPES,
	useNoticeSettings,
} from "@/features/settings/hooks/useNoticeSettings";

export default function NoticeSettingClient() {
	const {
		state: {
			bannerText,
			currentType,
			gradientColor,
			gradientWidth,
			textColor,
			backgroundColor,
			ratio,
			showResetDialog,
			editor,
			urlPaste,
			dropIndicatorY,
			canvasRef,
			isDirty,
		},
		actions: {
			closeUrlPaste,
			setBannerText,
			setCurrentType,
			setGradientColor,
			setGradientWidth,
			setTextColor,
			setBackgroundColor,
			setShowResetDialog,
			handleSave,
			handleReset,
		},
	} = useNoticeSettings();

	useSettingHeaderAction(
		<Button
			type="submit"
			form="setting-form-notice"
			variant="ghost"
			size="icon"
			disabled={!isDirty}
			aria-label="저장하기"
			title="저장하기"
			className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
			style={{
				transition: "all 0.3s ease-in-out",
			}}
		>
			<Save size={16} />
		</Button>,
		[isDirty],
	);

	return (
		<form
			id="setting-form-notice"
			onSubmit={(e) => {
				e.preventDefault();
				handleSave();
			}}
			className="space-y-8"
		>
			<section>
				<h2 className="text-[20px] font-semibold font-title">텍스트바 설정</h2>
				<div className="section-wrap mt-6">
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">텍스트바 내용</h3>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								움직이는 한 줄 텍스트
							</p>
						</div>
						<div className="flex-1">
							<Input
								placeholder="텍스트바 내용을 입력해주세요"
								value={bannerText}
								onChange={(e) => setBannerText(e.target.value)}
								className="rounded-card border-card bg-card-bg"
							/>
						</div>
					</div>

					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">텍스트 컬러</h3>
						</div>
						<div className="flex items-center gap-3">
							<ColorPicker value={textColor} onChange={setTextColor} />
							<span className="text-sm font-mono" style={{ color: textColor }}>
								{textColor}
							</span>
						</div>
					</div>

					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">배경 컬러</h3>
						</div>
						<div className="flex items-center gap-3">
							<ColorPicker value={backgroundColor} onChange={setBackgroundColor} />
							<span className="text-sm font-mono" style={{ color: backgroundColor }}>
								{backgroundColor}
							</span>
						</div>
					</div>

					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">양쪽 끝 처리</h3>
						</div>
						<div className="grid grid-cols-2 gap-3">
							{MARQUEE_TYPES.map((type) => (
								<RadioItem
									key={type}
									onClickRadio={() => setCurrentType(type)}
									checked={currentType === type}
									content={type}
								/>
							))}
						</div>
					</div>

					{currentType === "컬러" && (
						<>
							<div className="section-box flex items-center mt-4">
								<div className="text-box w-[220px] pr-5">
									<h3 className="font-medium text-sub-text">그라디언트 컬러</h3>
								</div>
								<div className="flex items-center gap-3">
									<ColorPicker value={gradientColor} onChange={setGradientColor} />
									<span className="text-sm font-mono" style={{ color: gradientColor }}>
										{gradientColor}
									</span>
								</div>
							</div>

							<div className="section-box flex items-center mt-4">
								<div className="text-box w-[220px] pr-5">
									<h3 className="font-medium text-sub-text">그라디언트 너비</h3>
								</div>
								<div className="flex-1 flex items-center gap-4">
									<Slider
										min={GRADIENT_SETTINGS.MIN}
										max={GRADIENT_SETTINGS.MAX}
										step={10}
										value={[gradientWidth]}
										onValueChange={(value) => setGradientWidth(value[0])}
										className="flex-1 min-w-[200px]"
									/>
									<Input
										type="number"
										min={GRADIENT_SETTINGS.MIN}
										max={GRADIENT_SETTINGS.MAX}
										value={gradientWidth}
										onChange={(e) => setGradientWidth(Number(e.target.value))}
										className="w-24 rounded-card border-card bg-card-bg"
									/>
								</div>
							</div>
						</>
					)}
				</div>
			</section>

			<Separator className="my-12" />

			<section>
				<h2 className="text-[20px] font-semibold font-title">공지사항 설정</h2>
				<div className="section-wrap mt-6">
					{editor && (
						<div className="space-y-4">
							<div className="border-card rounded-card bg-card-bg p-2">
								<TiptapToolbar editor={editor} />
							</div>

							<div className="grid grid-cols-12 grid-rows-12 gap-2.5 w-full aspect-[5/4] bg-card-bg border-card rounded-card p-3">
								<div
									ref={canvasRef}
									className="widget-wrapper max-w-3xl w-full min-h-16 max-h-[700px]"
									style={{
										gridColumn: (() => {
											const totalColumns = 12;
											const span = ratio.w || 12;
											const start = Math.floor((totalColumns - span) / 2) + 1;
											return `${start} / span ${span}`;
										})(),
										gridRow: `span ${ratio.h || 12}`,
									}}
								>
									<ScrollArea className="h-full w-full">
										<EditorImageDropZone editor={editor}>
											<EditorContent editor={editor} className="h-full w-full" />
										</EditorImageDropZone>
									</ScrollArea>
								</div>
							</div>
						</div>
					)}
				</div>
			</section>

			{urlPaste && (
				<UrlPasteMenu editor={editor} info={urlPaste} onClose={closeUrlPaste} />
			)}
			{dropIndicatorY != null && (
				<BlockDropIndicator editor={editor} y={dropIndicatorY} />
			)}

			<Separator className="my-12" />

			<div className="flex justify-end gap-3 pt-6">
				<Button
					type="button"
					onClick={() => setShowResetDialog(true)}
					className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
					style={{
						transition: "all 0.3s ease-in-out",
					}}
				>
					초기화하기
				</Button>
			</div>

			<Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
				<DialogContent className="rounded-card border-card bg-card-bg backdrop-blur-sm">
					<DialogHeader>
						<DialogTitle>공지사항 초기화</DialogTitle>
						<DialogDescription>
							정말 공지사항을 초기화할까요? 모든 내용이 삭제됩니다.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowResetDialog(false)}
							className="rounded-card border-card bg-card-bg"
						>
							취소
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleReset}
							className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
							style={{
								transition: "all 0.3s ease-in-out",
							}}
						>
							초기화
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</form>
	);
}
