"use client";

import { useMemo, useState, useCallback } from "react";
import { Save, Trash2, Upload, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/shared/lib/utils";
import { useFileUpload } from "@/hooks/useFileUpload";
import type { FontRegistryItem } from "@/contexts/SettingsContext";
import { API_BASE } from "@/shared/lib/http/client";
import { isFontFileUrl } from "@/shared/lib/fonts";

type FontSource = "url" | "file";

interface FontRegisterDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	fontRegistry: FontRegistryItem[];
	onUpdate: (nextRegistry: FontRegistryItem[]) => Promise<void>;
}

const buildFontId = () =>
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `font-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const extractFontName = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) return "";
	const withoutQuery = trimmed.split("?")[0];
	const lastSegment = withoutQuery.split("/").pop() || "";
	// Remove extension for font files
	return lastSegment.replace(/\.(woff2?|ttf|otf|eot|css)$/i, "") || trimmed;
};

/** Google Fonts URL에서 font-family 이름 추출 */
const extractGoogleFontsFamily = (url: string): string | null => {
	try {
		const u = new URL(url);
		if (!u.hostname.includes("fonts.googleapis.com")) return null;
		const family = u.searchParams.get("family");
		if (!family) return null;
		// "Noto+Sans+KR:wght@400" → "Noto Sans KR"
		return family.split(":")[0].replace(/\+/g, " ");
	} catch {
		return null;
	}
};

/** CSS 텍스트에서 @font-face font-family 이름 목록 추출 */
const parseFontFamiliesFromCSS = (cssText: string): string[] => {
	const families = new Set<string>();
	// @font-face { ... font-family: "Foo"; ... } 또는 font-family: Foo;
	const fontFaceBlocks = cssText.match(/@font-face\s*\{[^}]*\}/gi) ?? [];
	for (const block of fontFaceBlocks) {
		const match = block.match(/font-family\s*:\s*["']?([^"';]+)["']?\s*;/i);
		if (match?.[1]) {
			families.add(match[1].trim());
		}
	}
	return Array.from(families);
};

/** URL에서 CSS를 가져와 font-family 목록 추출 (CORS 실패 시 빈 배열 반환) */
const detectFontFamiliesFromUrl = async (url: string): Promise<string[]> => {
	try {
		const res = await fetch(url, { cache: "no-store" });
		if (!res.ok) return [];
		const text = await res.text();
		return parseFontFamiliesFromCSS(text);
	} catch {
		return [];
	}
};

export default function FontRegisterDialog({
	open,
	onOpenChange,
	fontRegistry,
	onUpdate,
}: FontRegisterDialogProps) {
	const [source, setSource] = useState<FontSource>("url");
	const [name, setName] = useState("");
	const [family, setFamily] = useState("");
	const [url, setUrl] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");
	const [selectedFileName, setSelectedFileName] = useState("");
	const [isDetecting, setIsDetecting] = useState(false);
	const [detectedFamilies, setDetectedFamilies] = useState<string[]>([]);

	const {
		uploadFile,
		state: uploadState,
		reset,
	} = useFileUpload({
		allowedTypes: ["*/*"],
		endpoint: `${API_BASE}/images/uploadFont`,
		maxSize: 20 * 1024 * 1024,
	});

	const isSubmitDisabled = useMemo(() => {
		if (!name.trim() || !family.trim()) return true;
		if (!url.trim()) return true;
		return isSaving || uploadState.loading || isDetecting;
	}, [name, family, url, isSaving, uploadState.loading, isDetecting]);

	const resetForm = () => {
		setName("");
		setFamily("");
		setUrl("");
		setSelectedFileName("");
		setError("");
		setSource("url");
		setDetectedFamilies([]);
		reset();
	};

	/** CSS URL에서 폰트 패밀리 자동 감지 */
	const handleDetectFonts = useCallback(async (inputUrl: string) => {
		const trimmed = inputUrl.trim();
		if (!trimmed || isFontFileUrl(trimmed)) return;

		// Google Fonts URL은 URL 파싱으로 처리
		const googleFamily = extractGoogleFontsFamily(trimmed);
		if (googleFamily) {
			if (!family.trim()) setFamily(googleFamily);
			if (!name.trim()) setName(googleFamily);
			return;
		}

		// 일반 CSS URL은 직접 fetch해서 파싱
		setIsDetecting(true);
		setError("");
		try {
			const families = await detectFontFamiliesFromUrl(trimmed);
			if (families.length === 1) {
				if (!family.trim()) setFamily(families[0]);
				if (!name.trim()) setName(families[0]);
				setDetectedFamilies([]);
			} else if (families.length > 1) {
				setDetectedFamilies(families);
				// 첫 번째 폰트를 기본값으로
				if (!family.trim()) setFamily(families[0]);
				if (!name.trim()) setName(families[0]);
			}
		} catch {
			// 자동 감지 실패 시 무시 (사용자가 직접 입력)
		} finally {
			setIsDetecting(false);
		}
	}, [family, name]);

	/** URL 입력 필드 blur 시 자동 감지 */
	const handleUrlBlur = () => {
		if (url.trim()) {
			// 이름 자동 채우기 (name이 비어있으면)
			if (!name.trim()) {
				const extracted = extractFontName(url.trim());
				if (extracted) setName(extracted);
			}
			void handleDetectFonts(url.trim());
		}
	};

	/** 감지된 폰트 선택 시 */
	const handleSelectDetectedFamily = (value: string) => {
		setFamily(value);
		setName(value);
	};

	const handleAddFont = async () => {
		if (isSubmitDisabled) return;
		setIsSaving(true);
		setError("");
		try {
			const nextRegistry = [
				...fontRegistry,
				{
					id: buildFontId(),
					name: name.trim(),
					family: family.trim(),
					source,
					url: url.trim(),
				},
			];
			await onUpdate(nextRegistry);
			resetForm();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "폰트 등록에 실패했습니다."
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleRemoveFont = async (fontId: string) => {
		const nextRegistry = fontRegistry.filter((font) => font.id !== fontId);
		await onUpdate(nextRegistry);
	};

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;
		setError("");
		setSelectedFileName(file.name);
		try {
			const uploadedUrl = await uploadFile(file);
			setUrl(uploadedUrl);
			if (!name.trim()) {
				setName(extractFontName(file.name));
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "폰트 업로드에 실패했습니다."
			);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[640px] bg-card border-card rounded-card backdrop-blur-card">
				<DialogHeader>
					<DialogTitle className="font-title">폰트 등록하기</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					<div className="flex gap-2">
						<Button
							type="button"
							variant={source === "url" ? "default" : "ghost"}
							onClick={() => setSource("url")}
						>
							웹 폰트 URL
						</Button>
						<Button
							type="button"
							variant={source === "file" ? "default" : "ghost"}
							onClick={() => setSource("file")}
						>
							폰트 파일 업로드
						</Button>
					</div>

					<div className="grid gap-4">
						{source === "url" ? (
							<div className="grid gap-2">
								<label className="text-sm text-sub-text">CSS / 폰트 URL</label>
								<div className="flex gap-2">
									<Input
										value={url}
										onChange={(e) => {
											setUrl(e.target.value);
											setDetectedFamilies([]);
										}}
										onBlur={handleUrlBlur}
										placeholder="https://fonts.googleapis.com/css2?family=Noto+Sans+KR"
										className="rounded-card border-card bg-card-bg flex-1"
									/>
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() => handleDetectFonts(url)}
										disabled={!url.trim() || isDetecting}
										title="폰트 자동 감지"
										className="rounded-card border-card bg-card-bg shrink-0"
									>
										{isDetecting ? (
											<Loader2 size={14} className="animate-spin" />
										) : (
											<Search size={14} />
										)}
									</Button>
								</div>
								<p className="text-xs text-sub-text">
									Google Fonts, jsDelivr 등 CSS URL 또는 직접 폰트 파일 URL (.woff2, .ttf 등)
								</p>
							</div>
						) : (
							<div className="grid gap-2">
								<label className="text-sm text-sub-text">폰트 파일</label>
								<div className="flex items-center gap-2">
									<label
										htmlFor="font-file-upload"
										className={cn(
											"inline-flex items-center gap-2 px-3 py-2 rounded-card border-card bg-card-bg cursor-pointer text-sm",
											uploadState.loading && "opacity-60 pointer-events-none"
										)}
									>
										<Upload size={14} />
										<span>파일 선택</span>
									</label>
									<input
										id="font-file-upload"
										type="file"
										accept=".woff,.woff2,.ttf,.otf,.eot"
										onChange={handleFileChange}
										className="hidden"
									/>
									{selectedFileName ? (
										<span className="text-xs text-sub-text">
											{selectedFileName}
										</span>
									) : null}
								</div>
								{url ? (
									<p className="text-xs text-sub-text">업로드 완료: {url}</p>
								) : null}
							</div>
						)}

						<div className="grid gap-2">
							<label className="text-sm text-sub-text">폰트 이름</label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="예: 프리텐다드"
								className="rounded-card border-card bg-card-bg"
							/>
						</div>

						<div className="grid gap-2">
							<div className="flex items-center justify-between">
								<label className="text-sm text-sub-text">폰트 패밀리</label>
								{detectedFamilies.length > 1 && (
									<span className="text-xs text-theme-primary">
										{detectedFamilies.length}개 폰트 감지됨
									</span>
								)}
							</div>
							{detectedFamilies.length > 1 ? (
								<Select
									value={family}
									onValueChange={handleSelectDetectedFamily}
								>
									<SelectTrigger className="rounded-card border-card bg-card-bg">
										<SelectValue placeholder="폰트 선택" />
									</SelectTrigger>
									<SelectContent>
										{detectedFamilies.map((f) => (
											<SelectItem key={f} value={f}>
												<span style={{ fontFamily: f }}>{f}</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<Input
									value={family}
									onChange={(e) => setFamily(e.target.value)}
									placeholder="예: Pretendard"
									className="rounded-card border-card bg-card-bg"
								/>
							)}
							<p className="text-xs text-sub-text">
								CSS 파일에 정의된 <code className="font-mono">font-family</code> 이름과 정확히 일치해야 합니다.
								{source === "url" && !isFontFileUrl(url) && (
									<> URL 입력 후 🔍 버튼으로 자동 감지할 수 있습니다.</>
								)}
							</p>
						</div>
					</div>

					{error ? <p className="text-sm text-red-500">{error}</p> : null}

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							onClick={handleAddFont}
							disabled={isSubmitDisabled}
						>
							<Save size={14} />
							등록
						</Button>
					</div>

					{fontRegistry.length > 0 ? (
						<div className="border-t border-card-bg pt-4 space-y-2">
							<p className="text-sm font-medium text-main-text">등록된 폰트</p>
							<div className="space-y-2">
								{fontRegistry.map((font) => (
									<div
										key={font.id}
										className="flex items-center justify-between gap-3 rounded-card border-card bg-card-bg px-3 py-2"
									>
										<div className="min-w-0">
											<p className="text-sm text-main-text">{font.name}</p>
											<p className="text-xs text-sub-text font-mono">{font.family}</p>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => handleRemoveFont(font.id ?? "")}
											aria-label="삭제"
										>
											<Trash2 size={14} />
										</Button>
									</div>
								))}
							</div>
						</div>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}
