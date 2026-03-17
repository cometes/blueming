import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useEditor } from "@tiptap/react";
import { toast } from "sonner";
import { extensions } from "@/components/editor/TiptapEditor";
import { useSettings } from "@/contexts/SettingsContext";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { setSettingsNotice } from "@/features/settings/api/main";
import type { Notice } from "@/features/settings/types";

const CANVAS_RATIO_BASE = 12;
const LAYOUT_ITEM_ID = "공지";

export const DEFAULT_NOTICE_COLORS = {
	GRADIENT: "#1890ff",
	TEXT: "#000000",
	BACKGROUND: "#ffffff",
} as const;

export const GRADIENT_SETTINGS = {
	MIN: 100,
	MAX: 500,
	DEFAULT: 100,
} as const;

export const MARQUEE_TYPES = ["투명", "컬러"] as const;
const LEGACY_MARQUEE_TYPE_MAP: Record<string, (typeof MARQUEE_TYPES)[number]> = {
	transparent: "투명",
	color: "컬러",
};

interface Ratio {
	w: number;
	h: number;
}

const calculateRatio = (width: number, height: number): Ratio => {
	const aspectRatio = width / height;
	if (width > height) {
		return {
			w: CANVAS_RATIO_BASE,
			h: Math.round(CANVAS_RATIO_BASE / aspectRatio),
		};
	}
	if (height > width) {
		return {
			w: Math.round(CANVAS_RATIO_BASE * aspectRatio),
			h: CANVAS_RATIO_BASE,
		};
	}
	return { w: CANVAS_RATIO_BASE, h: CANVAS_RATIO_BASE };
};

const normalizeMarqueeType = (value: unknown) => {
	if (typeof value !== "string") return "투명";
	return LEGACY_MARQUEE_TYPE_MAP[value] ?? value;
};

export function useNoticeSettings() {
	const { main, refreshSettings, updateMain } = useSettings();
	const canvasRef = useRef<HTMLDivElement>(null);
	const [bannerText, setBannerText] = useState("");
	const [currentType, setCurrentType] = useState<string>("투명");
	const [gradientColor, setGradientColor] = useState<string>(
		DEFAULT_NOTICE_COLORS.GRADIENT,
	);
	const [gradientWidth, setGradientWidth] = useState<number>(
		GRADIENT_SETTINGS.DEFAULT,
	);
	const [textColor, setTextColor] = useState<string>(DEFAULT_NOTICE_COLORS.TEXT);
	const [backgroundColor, setBackgroundColor] = useState<string>(
		DEFAULT_NOTICE_COLORS.BACKGROUND,
	);
	const [ratio, setRatio] = useState<Ratio>({ w: 0, h: 0 });
	const [showResetDialog, setShowResetDialog] = useState(false);
	const [isSyncing, setIsSyncing] = useState(true);
	const [editorContent, setEditorContent] = useState("<p></p>");

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

	useEffect(() => {
		setIsSyncing(true);
		if (main?.notice) {
			const noticeData = main.notice;
			setBannerText(noticeData.bannerText || "");
			const content =
				typeof noticeData.noticeContent === "string" && noticeData.noticeContent.trim()
					? noticeData.noticeContent.trim()
					: "<p></p>";
			editor?.commands.setContent(content.startsWith("<") ? content : `<p>${content}</p>`);
			setEditorContent(content.startsWith("<") ? content : `<p>${content}</p>`);
			if (noticeData.marqueeSettings) {
				const marqueeSettings = noticeData.marqueeSettings;
				setCurrentType(normalizeMarqueeType(marqueeSettings.type));
				setGradientColor(
					marqueeSettings.gradientColor || DEFAULT_NOTICE_COLORS.GRADIENT,
				);
				setGradientWidth(
					marqueeSettings.gradientWidth || GRADIENT_SETTINGS.DEFAULT,
				);
				setTextColor(marqueeSettings.textColor || DEFAULT_NOTICE_COLORS.TEXT);
				setBackgroundColor(
					marqueeSettings.backgroundColor || DEFAULT_NOTICE_COLORS.BACKGROUND,
				);
			}
		}
		setIsSyncing(false);
	}, [editor, main?.notice]);

	useEffect(() => {
		if (!editor) return;
		const updateContent = () => setEditorContent(editor.getHTML());
		updateContent();
		editor.on("blur", updateContent);
		return () => {
			editor.off("blur", updateContent);
		};
	}, [editor]);

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

	const isDirty = useMemo(() => {
		if (isSyncing) return false;
		const baseline = main?.notice;
		const baselineMarquee = baseline?.marqueeSettings;
		const baselineBannerText = baseline?.bannerText || "";
		const baselineContent =
			typeof baseline?.noticeContent === "string" && baseline.noticeContent.trim()
				? baseline.noticeContent.trim()
				: "<p></p>";
		return (
			bannerText !== baselineBannerText ||
			(editorContent || "<p></p>").trim() !== baselineContent ||
			currentType !== normalizeMarqueeType(baselineMarquee?.type) ||
			gradientColor !==
				(baselineMarquee?.gradientColor || DEFAULT_NOTICE_COLORS.GRADIENT) ||
			gradientWidth !==
				(baselineMarquee?.gradientWidth || GRADIENT_SETTINGS.DEFAULT) ||
			textColor !== (baselineMarquee?.textColor || DEFAULT_NOTICE_COLORS.TEXT) ||
			backgroundColor !==
				(baselineMarquee?.backgroundColor || DEFAULT_NOTICE_COLORS.BACKGROUND)
		);
	}, [
		bannerText,
		editorContent,
		currentType,
		gradientColor,
		gradientWidth,
		textColor,
		backgroundColor,
		main?.notice,
		isSyncing,
	]);
	useSettingStatus("notice", isDirty ? "dirty" : "saved");

	const buildNoticeData = useCallback((): Notice => {
		const editorDimensions = canvasRef.current
			? canvasRef.current.getBoundingClientRect()
			: { width: 0, height: 0 };
		return {
			bannerText,
			noticeContent: editor?.getHTML() || "<p></p>",
			marqueeSettings: {
				type: currentType,
				gradientColor,
				gradientWidth,
				textColor,
				backgroundColor,
				marqueeType: currentType,
			},
			editorDimensions: {
				width: editorDimensions.width,
				height: editorDimensions.height,
			},
		};
	}, [
		backgroundColor,
		bannerText,
		currentType,
		editor,
		gradientColor,
		gradientWidth,
		textColor,
	]);

	const broadcastNotice = useCallback((content: string, dimensions: { width: number; height: number }) => {
		const channel = new BroadcastChannel("noticeUpdated");
		channel.postMessage({ content, editorDimensions: dimensions });
		channel.close();
	}, []);

	const handleSave = useCallback(async () => {
		try {
			const noticeData = buildNoticeData();
			await setSettingsNotice(noticeData);
			updateMain?.({ notice: noticeData });
			await refreshSettings?.({ broadcast: true });
			broadcastNotice(noticeData.noticeContent, noticeData.editorDimensions);
			toast.success("저장되었습니다.");
		} catch {
			toast.error("저장에 실패했습니다.");
		}
	}, [broadcastNotice, buildNoticeData, refreshSettings, updateMain]);

	const handleReset = useCallback(async () => {
		try {
			const resetData: Notice = {
				bannerText: "",
				noticeContent: "<p></p>",
				marqueeSettings: {
					type: "투명",
					gradientColor: DEFAULT_NOTICE_COLORS.GRADIENT,
					gradientWidth: GRADIENT_SETTINGS.DEFAULT,
					textColor: DEFAULT_NOTICE_COLORS.TEXT,
					backgroundColor: DEFAULT_NOTICE_COLORS.BACKGROUND,
					marqueeType: "투명",
				},
				editorDimensions: { width: 0, height: 0 },
			};
			await setSettingsNotice(resetData);
			updateMain?.({ notice: resetData });
			await refreshSettings?.({ broadcast: true });
			setBannerText("");
			setCurrentType("투명");
			setGradientColor(DEFAULT_NOTICE_COLORS.GRADIENT);
			setGradientWidth(GRADIENT_SETTINGS.DEFAULT);
			setTextColor(DEFAULT_NOTICE_COLORS.TEXT);
			setBackgroundColor(DEFAULT_NOTICE_COLORS.BACKGROUND);
			editor?.commands.setContent("<p></p>");
			broadcastNotice("<p></p>", { width: 0, height: 0 });
			toast.success("설정이 초기화되었습니다!");
			setShowResetDialog(false);
		} catch {
			toast.error("초기화에 실패했습니다.");
		}
	}, [broadcastNotice, editor, refreshSettings, updateMain]);

	return {
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
			canvasRef,
			isDirty,
		},
		actions: {
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
	};
}
