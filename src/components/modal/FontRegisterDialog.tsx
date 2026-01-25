"use client";

import { useMemo, useState } from "react";
import { Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useFileUpload } from "@/hooks/useFileUpload";
import type { FontRegistryItem } from "@/contexts/SettingsContext";

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
	return lastSegment || trimmed;
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

	const {
		uploadFile,
		state: uploadState,
		reset,
	} = useFileUpload({
		allowedTypes: ["*/*"],
		endpoint: "https://api-w5buphcleq-du.a.run.app/images/uploadFont",
		maxSize: 20 * 1024 * 1024,
	});

	const isSubmitDisabled = useMemo(() => {
		if (!name.trim() || !family.trim()) return true;
		if (!url.trim()) return true;
		return isSaving || uploadState.loading;
	}, [name, family, url, isSaving, uploadState.loading]);

	const resetForm = () => {
		setName("");
		setFamily("");
		setUrl("");
		setSelectedFileName("");
		setError("");
		setSource("url");
		reset();
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
							<label className="text-sm text-sub-text">폰트 패밀리</label>
							<Input
								value={family}
								onChange={(e) => setFamily(e.target.value)}
								placeholder="예: Pretendard"
								className="rounded-card border-card bg-card-bg"
							/>
						</div>

						{source === "url" ? (
							<div className="grid gap-2">
								<label className="text-sm text-sub-text">CSS URL</label>
								<Input
									value={url}
									onChange={(e) => setUrl(e.target.value)}
									placeholder="https://fonts.googleapis.com/css2?family=... 또는 .woff2/.ttf"
									className="rounded-card border-card bg-card-bg"
								/>
								<p className="text-xs text-sub-text">
									폰트 파일 URL도 지원합니다. 파일 URL은 자동으로 @font-face로 처리됩니다.
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
											<p className="text-xs text-sub-text">{font.family}</p>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => handleRemoveFont(font.id)}
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
