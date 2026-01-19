/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { extensions } from "@/components/editor/TiptapEditor";
import SimpleTiptapToolbar from "@/components/tiptap/SimpleTiptapToolbar";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import { useSettings } from "@/contexts/SettingsContext";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { Save } from "lucide-react";
import {
	setSettingsProfile,
	ProfileData,
} from "@/queries/set/setSettingsProfile";
import { convertSlateToHTML, isSlateFormat } from "@/lib/slate-to-tiptap";
import { useFileUpload } from "@/hooks/useFileUpload";
import { listStickerAssets } from "@/queries/stickerAssets";
import type { StickerAsset } from "@/types/stickerBoard";

const ICON_SIZE = 28;
const ICON_COLOR = "#9BA2A8";

const PLACEHOLDERS = {
	NICKNAME: "닉네임을 입력해주세요",
	INTRODUCTION: "자기소개를 입력해주세요...",
	ETC: "기타 내용을 입력해주세요 (옵션)",
} as const;

const UPLOAD_TEXT = "Upload Image";

type ImageField = "headerImage" | "profileImage";

interface ImageUploadSectionProps {
	title: string;
	imageSrc?: string;
	onOpenPicker: () => void;
	onClearClick: () => void;
	isUploading?: boolean;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
	title,
	imageSrc,
	onOpenPicker,
	onClearClick,
	isUploading = false,
}) => (
	<div className="section-box flex items-center mt-4">
		<div className="text-box w-[220px] pr-5">
			<h3 className="font-medium text-sub-text">{title}</h3>
		</div>
		<div className="flex items-center gap-3">
			<button
				type="button"
				onClick={onOpenPicker}
				className={`relative w-3xs max-h-32 aspect-video rounded-card border-card bg-card-bg overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-card-active transition-colors ${
					isUploading ? "opacity-60 pointer-events-none" : ""
				}`}
			>
				{imageSrc ? (
					<img
						src={imageSrc}
						alt={title}
						className="w-full h-full object-contain"
					/>
				) : (
					<>
						<ImagePlus
							size={ICON_SIZE}
							color={ICON_COLOR}
							absoluteStrokeWidth={true}
						/>
						<span className="text-xs text-gray-500 dark:text-gray-400">
							{UPLOAD_TEXT}
						</span>
					</>
				)}
			</button>
			{imageSrc ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onClearClick}
					className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
					style={{
						transition: "all 0.3s ease-in-out",
					}}
				>
					<Trash2
						size={14}
						className="mr-2"
						style={{
							transition: "all 0.3s ease-in-out",
						}}
					/>
					비우기
				</Button>
			) : null}
		</div>
	</div>
);

export default function ProfileSettingClient() {
	const settings = useSettings();
	const refreshSettings = settings.refreshSettings;
	const updateMain = settings.updateMain;
	const { uploadFile, state: uploadState } = useFileUpload();
	const [profileData, setProfileData] = useState<ProfileData>({
		headerImage: "",
		profileImage: "",
		nickname: "",
		introduction: "",
		etc: "",
	});

	const [showResetDialog, setShowResetDialog] = useState(false);
	const [isSyncing, setIsSyncing] = useState(true);
	const [editorContent, setEditorContent] = useState("<p></p>");
	const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
	const [currentImageField, setCurrentImageField] = useState<ImageField | null>(
		null
	);
	const [imageThumbnail, setImageThumbnail] = useState("");
	const [imageSource, setImageSource] = useState<
		"file" | "asset" | "existing" | null
	>(null);
	const [pendingImages, setPendingImages] = useState<
		Record<ImageField, { file: File; previewUrl: string } | null>
	>({
		headerImage: null,
		profileImage: null,
	});
	const hasPendingImages = Object.values(pendingImages).some((img) => img);
	const [assets, setAssets] = useState<StickerAsset[]>([]);
	const [assetsLoading, setAssetsLoading] = useState(false);
	const [assetsError, setAssetsError] = useState<string | null>(null);
	const [assetSearchQuery, setAssetSearchQuery] = useState("");

	// Initialize Tiptap editor
	const editor = useEditor({
		extensions: [
			...extensions.filter((ext) => ext.name !== "placeholder"),
			// Override placeholder
			extensions.find((ext) => ext.name === "placeholder")?.configure({
				placeholder: PLACEHOLDERS.INTRODUCTION,
			}) || extensions.find((ext) => ext.name === "placeholder"),
		].filter(Boolean),
		content: "<p></p>",
		immediatelyRender: false,
		editorProps: {
			attributes: {
				class: "tiptap ProseMirror focus:outline-none min-h-[88px]",
			},
		},
	});

	// Load profile data from settings
	useEffect(() => {
		setIsSyncing(true);
		if (settings.main?.profile) {
			const profile = settings.main.profile;

			let introductionHTML = "<p></p>";

			// Handle Slate format conversion
			if (profile.introduction) {
				if (isSlateFormat(profile.introduction)) {
					const parsed = JSON.parse(profile.introduction);
					if (Array.isArray(parsed)) {
						introductionHTML = convertSlateToHTML(parsed);
					}
				} else {
					// Already HTML or plain text
					introductionHTML = profile.introduction;
				}
			}

			setProfileData({
				headerImage: profile.headerImage || "",
				profileImage: profile.profileImage || "",
				nickname: profile.nickname || "",
				introduction: introductionHTML,
				etc: profile.etc || "",
			});

			// Set editor content
			if (editor && introductionHTML) {
				editor.commands.setContent(introductionHTML);
				setEditorContent(introductionHTML);
			}
		}
		setIsSyncing(false);
	}, [settings.main?.profile, editor]);

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
		const baseline = settings.main?.profile;
		const intro = editorContent || "<p></p>";

		if (!baseline) {
			return (
				profileData.nickname !== "" ||
				profileData.etc !== "" ||
				profileData.headerImage !== "" ||
				profileData.profileImage !== "" ||
				intro !== "<p></p>"
			);
		}

		let baselineIntro = "<p></p>";
		if (baseline?.introduction) {
			if (isSlateFormat(baseline.introduction)) {
				try {
					const parsed = JSON.parse(baseline.introduction);
					if (Array.isArray(parsed)) {
						baselineIntro = convertSlateToHTML(parsed);
					}
				} catch {
					baselineIntro = baseline.introduction;
				}
			} else {
				baselineIntro = baseline.introduction;
			}
		}

		return (
			profileData.nickname !== (baseline.nickname || "") ||
			profileData.etc !== (baseline.etc || "") ||
			profileData.headerImage !== (baseline.headerImage || "") ||
			profileData.profileImage !== (baseline.profileImage || "") ||
			normalizeContent(intro) !== normalizeContent(baselineIntro)
		);
	}, [profileData, editorContent, settings.main?.profile, isSyncing]);

	useSettingStatus("profile", isDirty || hasPendingImages ? "dirty" : "saved");
	useSettingHeaderAction(
		<Button
			type="submit"
			form="setting-form-profile"
			variant="ghost"
			size="icon"
			disabled={(!isDirty && !hasPendingImages) || uploadState.loading}
			aria-label="저장하기"
			title="저장하기"
			className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
			style={{
				transition: "all 0.3s ease-in-out",
			}}
		>
			<Save size={16} />
		</Button>,
		[isDirty, hasPendingImages, uploadState.loading]
	);

	const handleInputChange = useCallback(
		(field: keyof ProfileData, value: string) => {
			setProfileData((prev) => ({
				...prev,
				[field]: value,
			}));
		},
		[]
	);

	const handleClearImage = useCallback(
		(field: ImageField) => {
			setPendingImages((prev) => {
				const pending = prev[field];
				if (pending) {
					URL.revokeObjectURL(pending.previewUrl);
				}
				return { ...prev, [field]: null };
			});
			setProfileData((prev) => ({
				...prev,
				[field]: "",
			}));
		},
		[]
	);

	const refreshAssets = useCallback(async () => {
		try {
			setAssetsLoading(true);
			setAssetsError(null);
			const list = await listStickerAssets("all");
			setAssets(list.filter((asset) => asset.url));
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "에셋을 불러오지 못했습니다.";
			setAssetsError(message);
		} finally {
			setAssetsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!isImageDialogOpen) return;
		void refreshAssets();
	}, [isImageDialogOpen, refreshAssets]);

	const handleOpenImageDialog = (field: ImageField) => {
		setCurrentImageField(field);
		const pending = pendingImages[field]?.previewUrl;
		const current = pending || profileData[field] || "";
		setImageThumbnail(current);
		if (pending) {
			setImageSource("file");
		} else if (profileData[field]) {
			setImageSource("existing");
		} else {
			setImageSource(null);
		}
		setIsImageDialogOpen(true);
	};

	const handleDialogFileSelect = (file: File, previewUrl: string) => {
		if (!currentImageField) return;
		const pending = pendingImages[currentImageField];
		if (pending) {
			URL.revokeObjectURL(pending.previewUrl);
		}
		setPendingImages((prev) => ({
			...prev,
			[currentImageField]: { file, previewUrl },
		}));
		setImageThumbnail(previewUrl);
		setImageSource("file");
	};

	const handleSelectAsset = (asset: StickerAsset) => {
		setImageThumbnail(asset.url);
		setImageSource("asset");
	};

	const handleDialogConfirm = (selectedUrl: string) => {
		if (currentImageField && imageSource === "asset" && selectedUrl) {
			const pending = pendingImages[currentImageField];
			if (pending) {
				URL.revokeObjectURL(pending.previewUrl);
			}
			setPendingImages((prev) => ({ ...prev, [currentImageField]: null }));
			setProfileData((prev) => ({
				...prev,
				[currentImageField]: selectedUrl,
			}));
		}
		setIsImageDialogOpen(false);
	};

	const handleSave = useCallback(async () => {
		try {
			// Get current editor content
			const introductionHTML = editor?.getHTML() || "<p></p>";

			const dataToSave: ProfileData = {
				...profileData,
				introduction: introductionHTML,
			};

			if (pendingImages.headerImage) {
				dataToSave.headerImage = await uploadFile(
					pendingImages.headerImage.file
				);
				URL.revokeObjectURL(pendingImages.headerImage.previewUrl);
			}
			if (pendingImages.profileImage) {
				dataToSave.profileImage = await uploadFile(
					pendingImages.profileImage.file
				);
				URL.revokeObjectURL(pendingImages.profileImage.previewUrl);
			}

			await setSettingsProfile(dataToSave);
			updateMain?.({ profile: dataToSave });
			await refreshSettings?.({ broadcast: true });

			// Broadcast update
			const channel = new BroadcastChannel("profileUpdated");
			channel.postMessage({ profile: dataToSave, timestamp: Date.now() });
			channel.close();

			setProfileData(dataToSave);
			setPendingImages({
				headerImage: null,
				profileImage: null,
			});
			toast.success("저장되었습니다.");
		} catch {
			toast.error("저장에 실패했습니다.");
		}
	}, [profileData, editor, refreshSettings, updateMain, pendingImages, uploadFile]);

	const handleReset = useCallback(async () => {
		try {
			const emptyProfile: ProfileData = {
				headerImage: "",
				profileImage: "",
				nickname: "",
				introduction: "",
				etc: "",
			};

			await setSettingsProfile(emptyProfile);
			updateMain?.({ profile: emptyProfile });
			await refreshSettings?.({ broadcast: true });

			setProfileData(emptyProfile);
			setPendingImages({
				headerImage: null,
				profileImage: null,
			});
			editor?.commands.setContent("<p></p>");

			// Broadcast update
			const channel = new BroadcastChannel("profileUpdated");
			channel.postMessage({ profile: emptyProfile, timestamp: Date.now() });
			channel.close();

			toast.success("프로필이 초기화되었습니다.");
			setShowResetDialog(false);
		} catch {
			toast.error("프로필 초기화에 실패했습니다.");
		}
	}, [editor, refreshSettings, updateMain]);

	useEffect(() => {
		return () => {
			Object.values(pendingImages).forEach((pending) => {
				if (pending) {
					URL.revokeObjectURL(pending.previewUrl);
				}
			});
		};
	}, [pendingImages]);

	return (
		<>
			<ImageUploadDialog
				isOpen={isImageDialogOpen}
				onOpenChange={(open) => {
					setIsImageDialogOpen(open);
					if (!open) {
						setAssetSearchQuery("");
					}
				}}
				thumbnail={imageThumbnail}
				setThumbnail={setImageThumbnail}
				onUpload={handleDialogConfirm}
				uploadMode="deferred"
				onFileSelect={handleDialogFileSelect}
				rightContent={
					<div>
						<div className="text-xs font-semibold text-main-text mb-2">
							에셋 목록
						</div>
						<AssetGrid
							assets={assets}
							loading={assetsLoading}
							error={assetsError}
							emptyMessage="에셋이 없습니다."
							emptySearchMessage="검색 결과가 없습니다."
							selectedUrl={imageThumbnail}
							onSelect={handleSelectAsset}
							enableSearch={true}
							searchQuery={assetSearchQuery}
							onSearchChange={setAssetSearchQuery}
							aspectClassName="aspect-square"
							imageClassName="w-full h-full object-contain"
							gridTemplateColumns="repeat(4, minmax(0, 1fr))"
							className="gap-1.5"
						/>
					</div>
				}
			/>
			<form
				id="setting-form-profile"
				onSubmit={(e) => {
					e.preventDefault();
					handleSave();
				}}
				className="space-y-8"
			>
				{/* Profile Settings Section */}
				<section>
					<h2 className="text-[20px] font-semibold font-title">프로필 설정</h2>
					<div className="section-wrap mt-6">
						{/* Header Image */}
						<ImageUploadSection
							title="헤더 이미지"
							imageSrc={
								pendingImages.headerImage?.previewUrl ||
								profileData.headerImage
							}
							onOpenPicker={() => handleOpenImageDialog("headerImage")}
							onClearClick={() => handleClearImage("headerImage")}
							isUploading={uploadState.loading}
						/>

						{/* Profile Image */}
						<ImageUploadSection
							title="프로필 이미지"
							imageSrc={
								pendingImages.profileImage?.previewUrl ||
								profileData.profileImage
							}
							onOpenPicker={() => handleOpenImageDialog("profileImage")}
							onClearClick={() => handleClearImage("profileImage")}
							isUploading={uploadState.loading}
						/>

						{/* Nickname */}
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px] pr-5 shrink-0">
								<h3 className="font-medium text-sub-text">닉네임</h3>
							</div>
							<div className="flex-1 min-w-0">
								<Input
									placeholder={PLACEHOLDERS.NICKNAME}
									value={profileData.nickname}
									onChange={(e) => handleInputChange("nickname", e.target.value)}
									className="rounded-card border-card bg-card-bg"
								/>
							</div>
						</div>

						{/* Introduction (Tiptap Editor) */}
						<div className="section-box flex items-start mt-4">
							<div className="text-box w-[220px] pr-5 pt-2 shrink-0">
								<h3 className="font-medium text-sub-text">자기소개</h3>
							</div>
							<div className="flex-1 min-w-0">
								{editor && (
									<div className="space-y-2">
										{/* Toolbar */}
										<div className="border-card rounded-card bg-card-bg p-2">
											<SimpleTiptapToolbar editor={editor} />
										</div>

										{/* Editor */}
										<div className="border-card rounded-card bg-card-bg p-3.5 min-h-[120px]">
											<EditorContent
												editor={editor}
												className="h-full w-full"
											/>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Etc */}
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px] pr-5 shrink-0">
								<h3 className="font-medium text-sub-text">etc</h3>
							</div>
							<div className="flex-1 min-w-0">
								<Input
									placeholder={PLACEHOLDERS.ETC}
									value={profileData.etc}
									onChange={(e) => handleInputChange("etc", e.target.value)}
									className="rounded-card border-card bg-card-bg"
								/>
							</div>
						</div>
					</div>
				</section>

				<Separator className="my-12" />

				{/* Action Buttons */}
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
					{/* 저장 버튼은 헤더로 이동 */}
				</div>

				{/* Reset Confirmation Dialog */}
				<Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
					<DialogContent className="rounded-card border-card bg-card-bg backdrop-blur-sm">
						<DialogHeader>
							<DialogTitle>프로필 초기화</DialogTitle>
							<DialogDescription>
								정말 프로필 설정을 초기화할까요? 모든 내용이 삭제됩니다.
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
		</>
	);
}
