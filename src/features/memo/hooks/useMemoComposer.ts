"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	createImageId,
	type CommentImage,
} from "@/features/comment/hooks/useCommentForm";
import {
	revokeCommentImageUrls,
	useCommentImageManager,
} from "@/features/comment/hooks/useCommentImageManager";
import { useTagPicker } from "@/hooks/useTagPicker";

export const MAX_MEMO_TAGS = 6;
export const MAX_MEMO_IMAGE_COUNT = 4;

export type MemoVisibility = "public" | "secret" | "protected";

export interface MemoComposerInitialValues {
	title?: string;
	content?: string;
	tags?: string[];
	visibility?: MemoVisibility;
	password?: string;
	imageUrls?: string[];
}

export interface MemoComposerPayload {
	title: string;
	content: string;
	tags: string[];
	visibility: MemoVisibility;
	password?: string;
	images: CommentImage[];
}

interface UseMemoComposerArgs {
	isOpen: boolean;
	mode: "create" | "edit";
	initialValues?: MemoComposerInitialValues;
	tagsOptions: string[];
	onOpenChange: (open: boolean) => void;
	onSubmit?: (payload: MemoComposerPayload) => void | Promise<void>;
}

/** MemoCreateModal의 작성 상태(제목/내용/태그/공개설정/이미지)와 제출 로직 */
export function useMemoComposer({
	isOpen,
	mode,
	initialValues,
	tagsOptions,
	onOpenChange,
	onSubmit,
}: UseMemoComposerArgs) {
	const [titleInput, setTitleInput] = useState("");
	const [contentInput, setContentInput] = useState("");
	const [visibility, setVisibility] = useState("public");
	const [password, setPassword] = useState("");
	const [images, setImages] = useState<CommentImage[]>([]);
	const tagPicker = useTagPicker({ tagsOptions, maxTags: MAX_MEMO_TAGS });
	const { tags, setTags, reset: resetTagPicker, setTagInput, setTagSearchInput, setTagInputOpen } = tagPicker;
	const imageManager = useCommentImageManager({
		maxImageCount: MAX_MEMO_IMAGE_COUNT,
	});
	const { imageDialog } = imageManager;

	const resetComposer = useCallback(() => {
		setTitleInput("");
		setContentInput("");
		resetTagPicker();
		setVisibility("public");
		setPassword("");
		setImages([]);
	}, [resetTagPicker]);

	useEffect(() => {
		if (!isOpen) {
			resetComposer();
		}
	}, [isOpen, resetComposer]);

	useEffect(() => {
		if (!isOpen || !initialValues) return;
		setTitleInput(initialValues.title ?? "");
		setContentInput(initialValues.content ?? "");
		setTagInput("");
		setTagSearchInput("");
		setTagInputOpen(false);
		setTags(Array.isArray(initialValues.tags) ? initialValues.tags : []);
		setVisibility(initialValues.visibility ?? "public");
		setPassword(initialValues.password ?? "");
		setImages(
			Array.isArray(initialValues.imageUrls)
				? initialValues.imageUrls.map((url) => ({
						id: createImageId(),
						url,
					}))
				: [],
		);
	}, [
		isOpen,
		initialValues,
		setTagInput,
		setTagSearchInput,
		setTagInputOpen,
		setTags,
	]);

	const handleImageDialogOpen = useCallback(() => {
		if (images.length >= MAX_MEMO_IMAGE_COUNT) {
			toast.error("이미지는 최대 4개까지 첨부할 수 있어요.");
			return;
		}
		imageManager.openDialog("create", images.length);
	}, [imageManager, images.length]);

	const removeImage = useCallback(
		(id: string) => {
			imageManager.removeImage(setImages, id);
		},
		[imageManager],
	);

	const handleImageUpload = useCallback(
		(url: string) => {
			if (!imageDialog.target || !url) return;
			if (images.length >= MAX_MEMO_IMAGE_COUNT) {
				toast.error("이미지는 최대 4개까지 첨부할 수 있어요.");
				return;
			}
			if (imageManager.addUploadedImages(url, setImages)) {
				toast.success("이미지가 추가되었습니다.");
			}
		},
		[imageDialog.target, imageManager, images.length],
	);

	useEffect(() => {
		return () => {
			revokeCommentImageUrls(images);
		};
	}, [images]);

	const handleSubmit = async () => {
		if (!contentInput.trim()) {
			toast.error("내용을 입력해주세요.");
			return;
		}
		const isEditProtected =
			mode === "edit" && initialValues?.visibility === "protected";
		if (visibility === "protected" && !password.trim() && !isEditProtected) {
			toast.error("보호글 비밀번호를 입력해주세요.");
			return;
		}
		if (onSubmit) {
			try {
				await onSubmit({
					title: titleInput.trim() || "제목 없음",
					content: contentInput.trim(),
					tags,
					visibility: visibility as MemoVisibility,
					password: visibility === "protected" ? password.trim() : undefined,
					images,
				});
				onOpenChange(false);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "메모 작성에 실패했습니다.";
				toast.error(message);
			}
			return;
		}
		onOpenChange(false);
	};

	return {
		titleInput,
		setTitleInput,
		contentInput,
		setContentInput,
		tagPicker,
		tags,
		visibility,
		setVisibility,
		password,
		setPassword,
		images,
		removeImage,
		handleImageDialogOpen,
		handleImageUpload,
		imageManager,
		handleSubmit,
	};
}

export type MemoComposer = ReturnType<typeof useMemoComposer>;
