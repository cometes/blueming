"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { useEditor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";
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
import { extensions } from "@/components/editor/TiptapEditor";
import TiptapToolbar from "@/components/tiptap/TiptapToolbar";
import { useSettings } from "@/contexts/SettingsContext";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { setSettingsNotice } from "@/queries/set/setSettingsNotice";

const CANVAS_RATIO_BASE = 12;
const LAYOUT_ITEM_ID = "공지";

const DEFAULT_COLORS = {
	GRADIENT: "#1890ff",
	TEXT: "#000000",
	BACKGROUND: "#ffffff",
} as const;

const GRADIENT_SETTINGS = {
	MIN: 100,
	MAX: 500,
	DEFAULT: 100,
} as const;

const MARQUEE_TYPES = ["투명", "컬러"] as const;
const LEGACY_MARQUEE_TYPE_MAP: Record<string, (typeof MARQUEE_TYPES)[number]> =
	{
		transparent: "투명",
		color: "컬러",
	};

interface Ratio {
	w: number;
	h: number;
}

interface MarqueeSettings {
	type: string;
	gradientColor: string;
	gradientWidth: number;
	textColor: string;
	backgroundColor: string;
}

interface EditorDimensions {
	width: number;
	height: number;
}

interface NoticeData {
	bannerText: string;
	noticeContent: string;
	marqueeSettings: MarqueeSettings;
	editorDimensions: EditorDimensions;
}

const calculateRatio = (width: number, height: number): Ratio => {
	const aspectRatio = width / height;

	if (width > height) {
		return {
			w: CANVAS_RATIO_BASE,
			h: Math.round(CANVAS_RATIO_BASE / aspectRatio),
		};
	} else if (height > width) {
		return {
			w: Math.round(CANVAS_RATIO_BASE * aspectRatio),
			h: CANVAS_RATIO_BASE,
		};
	} else {
		return { w: CANVAS_RATIO_BASE, h: CANVAS_RATIO_BASE };
	}
};

const normalizeMarqueeType = (value: unknown) => {
	if (typeof value !== "string") return "투명";
	return LEGACY_MARQUEE_TYPE_MAP[value] ?? value;
};

export default function NoticeSettingClient() {
	const { main, refreshSettings, updateMain } = useSettings();
	const canvasRef = useRef<HTMLDivElement>(null);

	// Marquee Settings State
	const [bannerText, setBannerText] = useState("");
	const [currentType, setCurrentType] = useState<string>("투명");
	const [gradientColor, setGradientColor] = useState<string>(
		DEFAULT_COLORS.GRADIENT
	);
	const [gradientWidth, setGradientWidth] = useState<number>(
		GRADIENT_SETTINGS.DEFAULT
	);
	const [textColor, setTextColor] = useState<string>(DEFAULT_COLORS.TEXT);
	const [backgroundColor, setBackgroundColor] = useState<string>(
		DEFAULT_COLORS.BACKGROUND
	);

	// Editor State
	const [ratio, setRatio] = useState<Ratio>({ w: 0, h: 0 });
	const [showResetDialog, setShowResetDialog] = useState(false);
	const [isSyncing, setIsSyncing] = useState(true);
	const [editorContent, setEditorContent] = useState("<p></p>");

	// Tiptap Editor
	const editor = useEditor({
		extensions,
		content: "<p></p>",
		immediatelyRender: false,
		editorProps: {
			attributes: {
				class: "prose prose-sm max-w-none focus:outline-none h-full p-4",
			},
		},
	});

	// Load initial data from settings
	useEffect(() => {
		setIsSyncing(true);
		if (main?.notice) {
			const noticeData = main.notice;

			if (noticeData.bannerText) {
				setBannerText(noticeData.bannerText);
			}

			if (noticeData.noticeContent) {
				const content =
					typeof noticeData.noticeContent === "string"
						? noticeData.noticeContent
						: "";
				if (content.trim()) {
					const nextContent = content.startsWith("<")
						? content
						: `<p>${content}</p>`;
					editor?.commands.setContent(nextContent);
					setEditorContent(nextContent);
				} else {
					editor?.commands.setContent("<p></p>");
					setEditorContent("<p></p>");
				}
			} else {
				setEditorContent(editor?.getHTML() || "<p></p>");
			}

			if (noticeData.marqueeSettings) {
				const marqueeSettings = noticeData.marqueeSettings;
				setCurrentType(normalizeMarqueeType(marqueeSettings.type));
				setGradientColor(
					marqueeSettings.gradientColor || DEFAULT_COLORS.GRADIENT
				);
				setGradientWidth(
					marqueeSettings.gradientWidth || GRADIENT_SETTINGS.DEFAULT
				);
				setTextColor(marqueeSettings.textColor || DEFAULT_COLORS.TEXT);
				setBackgroundColor(
					marqueeSettings.backgroundColor || DEFAULT_COLORS.BACKGROUND
				);
			}
		}
		setIsSyncing(false);
	}, [main?.notice, editor]);

	useEffect(() => {
		if (!editor) return;
		const updateContent = () => {
			setEditorContent(editor.getHTML());
		};
		updateContent();
		editor.on("blur", updateContent);
		return () => {
			editor.off("blur", updateContent);
		};
	}, [editor]);

	const isDirty = useMemo(() => {
		if (isSyncing) return false;
		const normalizeContent = (html?: string) => (html || "<p></p>").trim();
		const baseline = main?.notice;
		const baselineMarquee = baseline?.marqueeSettings;

		const baselineBannerText = baseline?.bannerText || "";
		const baselineContent =
			typeof baseline?.noticeContent === "string" &&
			baseline.noticeContent.trim()
				? baseline.noticeContent.trim()
				: "<p></p>";
		const baselineType = normalizeMarqueeType(baselineMarquee?.type);
		const baselineGradientColor =
			baselineMarquee?.gradientColor || DEFAULT_COLORS.GRADIENT;
		const baselineGradientWidth =
			baselineMarquee?.gradientWidth || GRADIENT_SETTINGS.DEFAULT;
		const baselineTextColor = baselineMarquee?.textColor || DEFAULT_COLORS.TEXT;
		const baselineBackgroundColor =
			baselineMarquee?.backgroundColor || DEFAULT_COLORS.BACKGROUND;

		const currentContent = normalizeContent(editorContent);

		return (
			bannerText !== baselineBannerText ||
			currentContent !== baselineContent ||
			currentType !== baselineType ||
			gradientColor !== baselineGradientColor ||
			gradientWidth !== baselineGradientWidth ||
			textColor !== baselineTextColor ||
			backgroundColor !== baselineBackgroundColor
		);
	}, [
		bannerText,
		editor,
		currentType,
		gradientColor,
		gradientWidth,
		textColor,
		backgroundColor,
		main?.notice,
		isSyncing,
		editorContent,
	]);

	useSettingStatus("notice", isDirty ? "dirty" : "saved");

	// Load layout ratio
	useEffect(() => {
		const customLayout = main?.customLayout?.layout as
			| Array<{ i: string; w: number; h: number }>
			| undefined;
		if (customLayout) {
			const noticeWidget = customLayout.find((el) => el.i === LAYOUT_ITEM_ID);
			if (noticeWidget) {
				setRatio(calculateRatio(noticeWidget.w, noticeWidget.h));
			}
		}
	}, [main?.customLayout?.layout]);

	// Listen to layout updates
	useEffect(() => {
		const channel = new BroadcastChannel("layoutUpdated");
		channel.onmessage = (e) => {
			const layout = e.data?.layout;
			if (layout) {
				const typedLayout = layout as Array<{ i: string; w: number; h: number }>;
				const noticeWidget = typedLayout.find((el) => el.i === LAYOUT_ITEM_ID);
				if (noticeWidget) {
					setRatio(calculateRatio(noticeWidget.w, noticeWidget.h));
				}
			}
		};
		return () => channel.close();
	}, []);

	// Save handler
	const handleSave = useCallback(async () => {
		try {
			const marqueeSettings: MarqueeSettings = {
				type: currentType,
				gradientColor,
				gradientWidth,
				textColor,
				backgroundColor,
			};

			const editorDimensions = canvasRef.current
				? canvasRef.current.getBoundingClientRect()
				: { width: 0, height: 0 };

			const noticeContent = editor?.getHTML() || "<p></p>";

			const noticeData: NoticeData = {
				bannerText,
				noticeContent,
				marqueeSettings,
				editorDimensions: {
					width: editorDimensions.width,
					height: editorDimensions.height,
				},
			};

			await setSettingsNotice(noticeData);
			updateMain?.({ notice: noticeData });
			await refreshSettings?.({ broadcast: true });

			// Broadcast update
			const channel = new BroadcastChannel("noticeUpdated");
			channel.postMessage({ content: noticeContent, editorDimensions });
			channel.close();

			toast.success("저장되었습니다.");
		} catch {
			toast.error("저장에 실패했습니다.");
		}
	}, [
		bannerText,
		currentType,
		gradientColor,
		gradientWidth,
		textColor,
		backgroundColor,
		editor,
		refreshSettings,
		updateMain,
	]);

	// Reset handler
	const handleReset = useCallback(async () => {
		try {
			const resetData: NoticeData = {
				bannerText: "",
				noticeContent: "<p></p>",
				marqueeSettings: {
					type: "투명",
					gradientColor: DEFAULT_COLORS.GRADIENT,
					gradientWidth: GRADIENT_SETTINGS.DEFAULT,
					textColor: DEFAULT_COLORS.TEXT,
					backgroundColor: DEFAULT_COLORS.BACKGROUND,
				},
				editorDimensions: { width: 0, height: 0 },
			};

			await setSettingsNotice(resetData);
			updateMain?.({ notice: resetData });
			await refreshSettings?.({ broadcast: true });

			// Reset state
			setBannerText("");
			setCurrentType("투명");
			setGradientColor(DEFAULT_COLORS.GRADIENT);
			setGradientWidth(GRADIENT_SETTINGS.DEFAULT);
			setTextColor(DEFAULT_COLORS.TEXT);
			setBackgroundColor(DEFAULT_COLORS.BACKGROUND);
			editor?.commands.setContent("<p></p>");

			// Broadcast update
			const channel = new BroadcastChannel("noticeUpdated");
			channel.postMessage({
				content: "<p></p>",
				editorDimensions: { width: 0, height: 0 },
			});
			channel.close();

			toast.success("설정이 초기화되었습니다!");
			setShowResetDialog(false);
		} catch {
			toast.error("초기화에 실패했습니다.");
		}
	}, [editor, refreshSettings, updateMain]);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				handleSave();
			}}
			className="space-y-8"
		>
			{/* Textbar Settings Section */}
			<section>
				<h2 className="text-[20px] font-semibold">텍스트바 설정</h2>
				<div className="section-wrap mt-6">
					{/* Banner Text Input */}
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

					{/* Text Color */}
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

					{/* Background Color */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">배경 컬러</h3>
						</div>
						<div className="flex items-center gap-3">
							<ColorPicker
								value={backgroundColor}
								onChange={setBackgroundColor}
							/>
							<span
								className="text-sm font-mono"
								style={{ color: backgroundColor }}
							>
								{backgroundColor}
							</span>
						</div>
					</div>

					{/* Marquee Type */}
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

					{/* Gradient Settings (Conditional) */}
					{currentType === "컬러" && (
						<>
							{/* Gradient Color */}
							<div className="section-box flex items-center mt-4">
								<div className="text-box w-[220px] pr-5">
									<h3 className="font-medium text-sub-text">그라디언트 컬러</h3>
								</div>
								<div className="flex items-center gap-3">
									<ColorPicker
										value={gradientColor}
										onChange={setGradientColor}
									/>
									<span
										className="text-sm font-mono"
										style={{ color: gradientColor }}
									>
										{gradientColor}
									</span>
								</div>
							</div>

							{/* Gradient Width */}
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

			{/* Editor Section */}
			<section>
				<h2 className="text-[20px] font-semibold">공지사항 설정</h2>

				<div className="section-wrap mt-6">
					{editor && (
						<div className="space-y-4">
							{/* Toolbar */}
							<div className="border-card rounded-card bg-card-bg p-2">
								<TiptapToolbar editor={editor} />
							</div>

							{/* 12x12 Grid Container - 실제 메인 페이지와 동일한 구조 */}
							<div className="grid grid-cols-12 grid-rows-12 gap-2.5 w-full aspect-[5/4] bg-card-bg border-card rounded-card p-3">
								{/* Editor Canvas - 그리드 내에서 ratio에 따라 배치 */}
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
										<EditorContent editor={editor} className="h-full w-full" />
									</ScrollArea>
								</div>
							</div>
						</div>
					)}
				</div>
			</section>

			<Separator className="my-12" />

			{/* Action Buttons */}
			<div className="flex justify-end gap-3 pt-6">
				<Button
					type="button"
					variant="destructive"
					onClick={() => setShowResetDialog(true)}
				>
					초기화하기
				</Button>
				<Button type="submit" disabled={!isDirty}>
					저장하기
				</Button>
			</div>

			{/* Reset Confirmation Dialog */}
			<Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>공지사항 초기화</DialogTitle>
						<DialogDescription>
							정말 공지사항을 초기화할까요? 모든 내용이 삭제됩니다.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowResetDialog(false)}>
							취소
						</Button>
						<Button variant="destructive" onClick={handleReset}>
							초기화
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</form>
	);
}
