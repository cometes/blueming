"use client";

import { useState, useRef } from "react";
import { Download, Trash2, Upload as UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useThemes } from "@/contexts/ThemesContext";
import { dateConvert } from "@/lib/date";

const INPUT_HEIGHT = "h-9";

const PLACEHOLDERS = {
	THEME_NAME: "테마명을 입력해주세요",
} as const;

const BUTTON_TEXTS = {
	SAVING: "저장 중...",
	SAVE: "저장하기",
	APPLYING: "적용 중...",
	APPLY: "적용",
	IMPORT: "JSON 파일 선택",
} as const;

const SECTION_TEXTS = {
	SAVE_TITLE: "테마 세트 저장하기",
	SAVE_SUBTITLE:
		"홈페이지의 전체 디자인 및 설정을 저장하고 간편하게 교체할 수 있습니다.",
	INFO_TITLE: "테마 저장 및 적용 범위",
	CURRENT_SAVE: "현재 테마 저장",
	IMPORT: "테마 가져오기",
	LIST_TITLE: "테마 목록",
	LOADING: "테마를 불러오고 있습니다...",
	EMPTY_TITLE: "저장된 테마가 없습니다",
	EMPTY_DESC: "위에서 현재 설정을 테마로 저장해보세요!",
} as const;

const THEME_INFO_ITEMS = [
	"홈페이지 기본 설정 (제목, 설명, 색상 등)",
	"전체 디자인 (배경, 위젯, 카드, 폰트)",
	"메뉴 디자인 및 구성",
	"커스텀 레이아웃 및 슬라이드 설정",
] as const;

const ICON_SIZE = 16;
const EMPTY_ICON = "🎨";

interface ThemeItem {
	id: string;
	name: string;
	createdAt: string;
	general?: {
		design?: {
			background?: {
				color?: string;
				image?: string;
			};
		};
	};
}

export default function ThemeSettingClient() {
	const {
		themes,
		isLoading,
		createTheme,
		removeTheme,
		activateTheme,
		exportTheme,
		importTheme,
	} = useThemes();

	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);
	const [applying, setApplying] = useState<string | null>(null);
	const [removing, setRemoving] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
		null
	);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleSave = async () => {
		if (!name.trim()) return;

		setSaving(true);
		const success = await createTheme(name);
		if (success) {
			setName("");
		}
		setSaving(false);
	};

	const handleApply = async (id: string) => {
		setApplying(id);
		await activateTheme(id);
		setApplying(null);
	};

	const handleRemove = async (id: string) => {
		setRemoving(id);
		await removeTheme(id);
		setRemoving(null);
		setShowDeleteConfirm(null);
	};

	const downloadFile = (content: string, filename: string) => {
		const blob = new Blob([content], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleExport = (id: string) => {
		const themeData = exportTheme(id);
		if (themeData) {
			const themeToExport = themes.find((t) => t.id === id);
			const filename = `${themeToExport?.name || "theme"}-theme.json`;
			downloadFile(themeData, filename);
		}
	};

	const handleImport = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			await importTheme(text);
		} catch (err) {
			console.error("파일 읽기 실패:", err);
		}

		// Reset input
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const renderThemeInfoItems = () => (
		<div className="mt-3 space-y-2">
			{THEME_INFO_ITEMS.map((item, index) => (
				<div
					key={index}
					className="flex items-start gap-2 text-sm text-sub-text"
				>
					<span className="text-theme-primary mt-0.5">•</span>
					<span>{item}</span>
				</div>
			))}
		</div>
	);

	const renderLoadingState = () => (
		<div className="text-center py-10">
			<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-theme-primary border-r-transparent"></div>
			<div className="mt-4 text-sub-text">{SECTION_TEXTS.LOADING}</div>
		</div>
	);

	const renderEmptyState = () => (
		<div className="text-center py-16 text-sub-text">
			<div className="text-5xl mb-4">{EMPTY_ICON}</div>
			<div className="text-lg font-medium mb-2">
				{SECTION_TEXTS.EMPTY_TITLE}
			</div>
			<div className="text-sm">{SECTION_TEXTS.EMPTY_DESC}</div>
		</div>
	);

	const renderThemeCard = (item: ThemeItem) => {
		const bgStyle: React.CSSProperties = {};
		if (item.general?.design?.background?.image) {
			bgStyle.backgroundImage = `url(${item.general.design.background.image})`;
			bgStyle.backgroundSize = "cover";
			bgStyle.backgroundPosition = "center";
		} else if (item.general?.design?.background?.color) {
			bgStyle.backgroundColor = item.general.design.background.color;
		} else {
			bgStyle.background =
				"linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
		}

		return (
			<div
				key={item.id}
				className="rounded-card border-card bg-card-bg overflow-hidden hover:border-card-active transition-colors"
			>
				<div
					className="h-32 w-full relative"
					style={bgStyle}
				>
					<div className="absolute inset-0 bg-black/10"></div>
				</div>
				<div className="p-4">
					<h3 className="font-semibold text-base mb-1 truncate">
						{item.name}
					</h3>
					<p className="text-xs text-sub-text mb-4">
						{dateConvert(item.createdAt)}
					</p>
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => handleExport(item.id)}
							title="테마 내보내기"
							className="flex-1 rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
						>
							<Download size={ICON_SIZE} className="mr-1" />
							내보내기
						</Button>

						{showDeleteConfirm === item.id ? (
							<div className="flex gap-1 flex-1">
								<Button
									type="button"
									variant="destructive"
									size="sm"
									onClick={() => handleRemove(item.id)}
									disabled={removing === item.id}
									className="flex-1"
								>
									{removing === item.id ? "삭제 중..." : "O"}
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setShowDeleteConfirm(null)}
									className="flex-1"
								>
									X
								</Button>
							</div>
						) : (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setShowDeleteConfirm(item.id)}
								title="테마 삭제"
								className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
							>
								<Trash2 size={ICON_SIZE} />
							</Button>
						)}
					</div>
					<Button
						type="button"
						onClick={() => handleApply(item.id)}
						disabled={applying === item.id}
						className="w-full mt-2"
					>
						{applying === item.id
							? BUTTON_TEXTS.APPLYING
							: BUTTON_TEXTS.APPLY}
					</Button>
				</div>
			</div>
		);
	};

	return (
		<div className="space-y-8">
			{/* 테마 저장 Section */}
			<section>
				<h2 className="text-[20px] font-semibold">
					{SECTION_TEXTS.SAVE_TITLE}
				</h2>
				<p className="text-sm text-sub-text mt-1">
					{SECTION_TEXTS.SAVE_SUBTITLE}
				</p>

				<div className="mt-4 p-4 rounded-card border-card bg-card-bg">
					<h3 className="font-medium text-sub-text">
						{SECTION_TEXTS.INFO_TITLE}
					</h3>
					{renderThemeInfoItems()}
				</div>

				<div className="section-wrap mt-6">
					{/* 현재 테마 저장 */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px]">
							<h3 className="font-medium text-sub-text">
								{SECTION_TEXTS.CURRENT_SAVE}
							</h3>
						</div>
						<div className="flex items-center gap-3 flex-1">
							<Input
								placeholder={PLACEHOLDERS.THEME_NAME}
								value={name}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setName(e.target.value)
								}
								className={`${INPUT_HEIGHT} flex-1 max-w-md rounded-card border-card focus:border-card-active bg-card-bg`}
								onKeyPress={(e) => {
									if (e.key === "Enter") {
										handleSave();
									}
								}}
							/>
							<Button
								type="button"
								onClick={handleSave}
								disabled={!name.trim() || saving}
							>
								{saving ? BUTTON_TEXTS.SAVING : BUTTON_TEXTS.SAVE}
							</Button>
						</div>
					</div>

					{/* 테마 가져오기 */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px]">
							<h3 className="font-medium text-sub-text">
								{SECTION_TEXTS.IMPORT}
							</h3>
						</div>
						<div className="flex items-center gap-3">
							<input
								ref={fileInputRef}
								type="file"
								accept=".json"
								onChange={handleImport}
								className="hidden"
								id="theme-file-input"
							/>
							<Button
								type="button"
								variant="outline"
								onClick={() => fileInputRef.current?.click()}
								className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
							>
								<UploadIcon size={14} className="mr-2" />
								{BUTTON_TEXTS.IMPORT}
							</Button>
						</div>
					</div>
				</div>
			</section>

			<Separator className="my-12" />

			{/* 테마 목록 Section */}
			<section>
				<h2 className="text-[20px] font-semibold">
					{SECTION_TEXTS.LIST_TITLE}
				</h2>
				<div className="mt-6">
					{isLoading ? (
						renderLoadingState()
					) : themes?.length === 0 ? (
						renderEmptyState()
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{themes?.map(renderThemeCard)}
						</div>
					)}
				</div>
			</section>
		</div>
	);
}

