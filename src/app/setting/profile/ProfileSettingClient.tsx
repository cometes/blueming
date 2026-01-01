"use client";

import { useState, useEffect, useCallback } from "react";
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
import TiptapToolbar from "@/components/tiptap/TiptapToolbar";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import { useSettings } from "@/contexts/SettingsContext";
import {
	setSettingsProfile,
	ProfileData,
} from "@/queries/set/setSettingsProfile";
import { convertSlateToHTML, isSlateFormat } from "@/lib/slate-to-tiptap";

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
	onImageClick: () => void;
	onClearClick: () => void;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
	title,
	imageSrc,
	onImageClick,
	onClearClick,
}) => (
	<div className="section-box flex items-center mt-4">
		<div className="text-box w-[220px] pr-5">
			<h3 className="font-medium text-sub-text">{title}</h3>
		</div>
		<div className="flex items-center gap-3">
			{imageSrc ? (
				<>
					<div className="w-3xs max-h-32 aspect-video rounded-card border-card bg-card-bg overflow-hidden">
						<img
							src={imageSrc}
							alt={title}
							className="w-full h-full object-contain"
						/>
					</div>
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
				</>
			) : (
				<div
					onClick={onImageClick}
					className="w-3xs max-h-32 aspect-video rounded-card border-card bg-card-bg overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-card-active transition-colors"
				>
					<ImagePlus
						size={ICON_SIZE}
						color={ICON_COLOR}
						absoluteStrokeWidth={true}
					/>
					<span className="text-xs text-gray-500 dark:text-gray-400">
						{UPLOAD_TEXT}
					</span>
				</div>
			)}
		</div>
	</div>
);

export default function ProfileSettingClient() {
	const settings = useSettings();
	const [profileData, setProfileData] = useState<ProfileData>({
		headerImage: "",
		profileImage: "",
		nickname: "",
		introduction: "",
		etc: "",
	});

	const [showResetDialog, setShowResetDialog] = useState(false);
	const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
	const [currentImageField, setCurrentImageField] = useState<ImageField | "">(
		""
	);
	const [thumbnail, setThumbnail] = useState("");

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
		editorProps: {
			attributes: {
				class: "tiptap ProseMirror focus:outline-none min-h-[88px]",
			},
		},
	});

	// Load profile data from settings
	useEffect(() => {
		if (settings.main?.profile) {
			const profile = settings.main.profile;

			let introductionHTML = "<p></p>";

			// Handle Slate format conversion
			if (profile.introduction) {
				if (isSlateFormat(profile.introduction)) {
					introductionHTML = convertSlateToHTML(profile.introduction);
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
			}
		}
	}, [settings.main?.profile, editor]);

	const handleInputChange = useCallback(
		(field: keyof ProfileData, value: string) => {
			setProfileData((prev) => ({
				...prev,
				[field]: value,
			}));
		},
		[]
	);

	const handleImageUpload = useCallback(
		async (url: string) => {
			if (!currentImageField) return;

			const newData = {
				...profileData,
				[currentImageField]: url,
			};

			setProfileData(newData);

			try {
				await setSettingsProfile(newData);

				// Broadcast update
				const channel = new BroadcastChannel("profileUpdated");
				channel.postMessage({ profile: newData, timestamp: Date.now() });
				channel.close();

				toast.success("이미지가 업로드되었습니다.");
			} catch (error) {
				console.error("Image upload save error:", error);
				setProfileData(profileData);
				toast.error("이미지 업로드 저장에 실패했습니다.");
			}
		},
		[currentImageField, profileData]
	);

	const handleClearImage = useCallback(
		async (field: ImageField) => {
			const newData = {
				...profileData,
				[field]: "",
			};

			setProfileData(newData);

			try {
				await setSettingsProfile(newData);

				// Broadcast update
				const channel = new BroadcastChannel("profileUpdated");
				channel.postMessage({ profile: newData, timestamp: Date.now() });
				channel.close();

				toast.success("이미지가 삭제되었습니다.");
			} catch (error) {
				console.error("Image delete error:", error);
				setProfileData(profileData);
				toast.error("이미지 삭제 저장에 실패했습니다.");
			}
		},
		[profileData]
	);

	const handleSave = useCallback(async () => {
		try {
			// Get current editor content
			const introductionHTML = editor?.getHTML() || "<p></p>";

			const dataToSave = {
				...profileData,
				introduction: introductionHTML,
			};

			await setSettingsProfile(dataToSave);

			// Broadcast update
			const channel = new BroadcastChannel("profileUpdated");
			channel.postMessage({ profile: dataToSave, timestamp: Date.now() });
			channel.close();

			toast.success("프로필이 저장되었습니다.");
		} catch (error) {
			console.error("Save error:", error);
			toast.error("프로필 저장에 실패했습니다.");
		}
	}, [profileData, editor]);

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

			setProfileData(emptyProfile);
			editor?.commands.setContent("<p></p>");

			// Broadcast update
			const channel = new BroadcastChannel("profileUpdated");
			channel.postMessage({ profile: emptyProfile, timestamp: Date.now() });
			channel.close();

			toast.success("프로필이 초기화되었습니다.");
			setShowResetDialog(false);
		} catch (error) {
			console.error("Reset error:", error);
			toast.error("프로필 초기화에 실패했습니다.");
		}
	}, [editor]);

	const openImageDialog = (field: ImageField) => {
		setCurrentImageField(field);
		setIsUploadDialogOpen(true);
	};

	return (
		<>
			<ImageUploadDialog
				isOpen={isUploadDialogOpen}
				onOpenChange={setIsUploadDialogOpen}
				thumbnail={thumbnail}
				setThumbnail={setThumbnail}
				onUpload={handleImageUpload}
			/>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					handleSave();
				}}
				className="space-y-8"
			>
				{/* Profile Settings Section */}
				<section>
					<h2 className="text-[20px] font-semibold">프로필 설정</h2>
					<div className="section-wrap mt-6">
						{/* Header Image */}
						<ImageUploadSection
							title="헤더 이미지"
							imageSrc={profileData.headerImage}
							onImageClick={() => openImageDialog("headerImage")}
							onClearClick={() => handleClearImage("headerImage")}
						/>

						{/* Profile Image */}
						<ImageUploadSection
							title="프로필 이미지"
							imageSrc={profileData.profileImage}
							onImageClick={() => openImageDialog("profileImage")}
							onClearClick={() => handleClearImage("profileImage")}
						/>

						{/* Nickname */}
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px] pr-5">
								<h3 className="font-medium text-sub-text">닉네임</h3>
							</div>
							<div className="flex-1">
								<Input
									placeholder={PLACEHOLDERS.NICKNAME}
									value={profileData.nickname}
									onChange={(e) => handleInputChange("nickname", e.target.value)}
									className="rounded-card border-card bg-card-bg"
								/>
							</div>
						</div>

						{/* Introduction (Tiptap Editor) */}
						<div className="flex items-start mt-4">
							<div className="text-box w-[220px] pr-5 pt-2 shrink-0">
								<h3 className="font-medium text-sub-text">자기소개</h3>
							</div>
							<div className="flex-1 min-w-0">
								{editor && (
									<div className="space-y-2">
										{/* Toolbar */}
										<div className="border-card rounded-card bg-card-bg p-2">
											<TiptapToolbar editor={editor} />
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
							<div className="text-box w-[220px] pr-5">
								<h3 className="font-medium text-sub-text">etc</h3>
							</div>
							<div className="flex-1">
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

				<Separator />

				{/* Action Buttons */}
				<div className="flex justify-center gap-3">
					<Button
						type="button"
						variant="destructive"
						onClick={() => setShowResetDialog(true)}
					>
						초기화하기
					</Button>
					<Button type="submit">저장하기</Button>
				</div>

				{/* Reset Confirmation Dialog */}
				<Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>프로필 초기화</DialogTitle>
							<DialogDescription>
								정말 프로필 설정을 초기화할까요? 모든 내용이 삭제됩니다.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setShowResetDialog(false)}
							>
								취소
							</Button>
							<Button variant="destructive" onClick={handleReset}>
								초기화
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</form>
		</>
	);
}

