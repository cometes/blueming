"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Editor } from "@tiptap/react";
import { useSettings } from "@/contexts/SettingsContext";
import { setSettingsProfile } from "@/features/settings/api/main";
import type { ProfileData } from "@/features/settings/types";
import { convertSlateToHTML, isSlateFormat } from "@/lib/slate-to-tiptap";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useSettingsImagePicker } from "@/features/settings/hooks/useSettingsImagePicker";
import { usePendingImageUpload } from "@/features/settings/hooks/usePendingImageUpload";

type ImageField = "headerImage" | "profileImage";

export function useProfileSettingsController(editor: Editor | null) {
	const settings = useSettings();
	const refreshSettings = settings.refreshSettings;
	const updateMain = settings.updateMain;
	const { uploadFile, state: uploadState } = useFileUpload();
	const uploadPendingImages = usePendingImageUpload<ImageField>(uploadFile);
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
	const imagePicker = useSettingsImagePicker<ImageField>({
		fields: ["headerImage", "profileImage"] as const,
	});

	useEffect(() => {
		setIsSyncing(true);
		if (settings.main?.profile) {
			const profile = settings.main.profile;
			let introductionHTML = "<p></p>";
			if (profile.introduction) {
				if (isSlateFormat(profile.introduction)) {
					const parsed = JSON.parse(profile.introduction);
					if (Array.isArray(parsed)) {
						introductionHTML = convertSlateToHTML(parsed);
					}
				} else {
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

			if (editor && introductionHTML) {
				editor.commands.setContent(introductionHTML);
				setEditorContent(introductionHTML);
			}
		}
		setIsSyncing(false);
	}, [editor, settings.main?.profile]);

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
		if (baseline.introduction) {
			if (isSlateFormat(baseline.introduction)) {
				try {
					const parsed = JSON.parse(baseline.introduction);
					if (Array.isArray(parsed)) baselineIntro = convertSlateToHTML(parsed);
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
	}, [editorContent, isSyncing, profileData, settings.main?.profile]);

	const handleInputChange = useCallback((field: keyof ProfileData, value: string) => {
		setProfileData((prev) => ({ ...prev, [field]: value }));
	}, []);

	const handleClearImage = useCallback(
		(field: ImageField) => {
			imagePicker.actions.clearPendingImage(field);
			setProfileData((prev) => ({ ...prev, [field]: "" }));
		},
		[imagePicker.actions],
	);

	const handleOpenImageDialog = useCallback(
		(field: ImageField) => {
			imagePicker.actions.openImageDialog(field, profileData[field] || "");
		},
		[imagePicker.actions, profileData],
	);

	const handleDialogConfirm = useCallback(
		(selectedUrl: string) => {
			const currentImageField = imagePicker.state.activeField;
			if (currentImageField && imagePicker.state.imageSource === "asset" && selectedUrl) {
				imagePicker.actions.clearPendingImage(currentImageField);
				setProfileData((prev) => ({
					...prev,
					[currentImageField]: selectedUrl,
				}));
			}
			imagePicker.actions.closeImageDialog();
		},
		[imagePicker.actions, imagePicker.state.activeField, imagePicker.state.imageSource],
	);

	const handleSave = useCallback(async () => {
		try {
			const uploadedUrls = await uploadPendingImages(imagePicker.state.pendingImages);
			const dataToSave: ProfileData = {
				...profileData,
				...uploadedUrls,
				introduction: editor?.getHTML() || "<p></p>",
			};

			await setSettingsProfile(dataToSave);
			updateMain?.({ profile: dataToSave });
			await refreshSettings?.({ broadcast: true });

			const channel = new BroadcastChannel("profileUpdated");
			channel.postMessage({ profile: dataToSave, timestamp: Date.now() });
			channel.close();

			setProfileData(dataToSave);
			imagePicker.actions.clearAllPendingImages();
			toast.success("저장되었습니다.");
		} catch {
			toast.error("저장에 실패했습니다.");
		}
	}, [editor, imagePicker.actions, imagePicker.state.pendingImages, profileData, refreshSettings, updateMain, uploadPendingImages]);

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
			imagePicker.actions.clearAllPendingImages();
			editor?.commands.setContent("<p></p>");

			const channel = new BroadcastChannel("profileUpdated");
			channel.postMessage({ profile: emptyProfile, timestamp: Date.now() });
			channel.close();

			toast.success("프로필이 초기화되었습니다.");
			setShowResetDialog(false);
		} catch {
			toast.error("프로필 초기화에 실패했습니다.");
		}
	}, [editor, imagePicker.actions, refreshSettings, updateMain]);

	return {
		profileData,
		setProfileData,
		uploadState,
		showResetDialog,
		setShowResetDialog,
		isDirty,
		editorContent,
		handleInputChange,
		handleClearImage,
		handleOpenImageDialog,
		handleDialogConfirm,
		handleSave,
		handleReset,
		imagePicker,
	};
}
