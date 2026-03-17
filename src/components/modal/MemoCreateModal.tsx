/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth/store";
import { toast } from "sonner";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import { createImageId, type CommentImage } from "@/hooks/comment/useCommentForm";
import {
	revokeCommentImageUrls,
	useCommentImageManager,
} from "@/hooks/comment/useCommentImageManager";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface MemoCreateModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	tagsOptions?: string[];
	mode?: "create" | "edit";
	initialValues?: {
		title?: string;
		content?: string;
		tags?: string[];
		visibility?: "public" | "secret" | "protected";
		password?: string;
		imageUrls?: string[];
	};
	onSubmit?: (payload: {
		title: string;
		content: string;
		tags: string[];
		visibility: "public" | "secret" | "protected";
		password?: string;
		images: CommentImage[];
	}) => void | Promise<void>;
}

const normalizeTag = (value: string) =>
	value.replace(/^#/, "").replace(/\s+/g, "").trim();

const VISIBILITY_OPTIONS = [
	{ value: "public", label: "전체공개" },
	{ value: "secret", label: "비밀글" },
	{ value: "protected", label: "보호글" },
];
const MAX_IMAGE_COUNT = 4;

export default function MemoCreateModal({
	isOpen,
	onOpenChange,
	tagsOptions = [],
	mode = "create",
	initialValues,
	onSubmit,
}: MemoCreateModalProps) {
	const { user } = useAuthStore();
	const [titleInput, setTitleInput] = useState("");
	const [contentInput, setContentInput] = useState("");
	const [tagInput, setTagInput] = useState("");
	const [tagSearchInput, setTagSearchInput] = useState("");
	const [tagInputOpen, setTagInputOpen] = useState(false);
	const [tags, setTags] = useState<string[]>([]);
	const [visibility, setVisibility] = useState("public");
	const [password, setPassword] = useState("");
	const [images, setImages] = useState<CommentImage[]>([]);
	const [isMounted, setIsMounted] = useState(false);
	const tagJustAddedRef = useRef(false);
	const isComposingRef = useRef(false);
	const imageManager = useCommentImageManager({
		maxImageCount: MAX_IMAGE_COUNT,
	});
	const { imageDialog, assets } = imageManager;

	const displayName = user?.displayName || "게스트";
	const avatarUrl = user?.photoURL || "";
	const initial = displayName.trim().charAt(0).toUpperCase();

	useEffect(() => {
		if (!isOpen) {
			resetComposer();
		}
	}, [isOpen]);

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
	}, [isOpen, initialValues]);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const resetComposer = () => {
		setTitleInput("");
		setContentInput("");
		setTagInput("");
		setTagSearchInput("");
		setTagInputOpen(false);
		setTags([]);
		setVisibility("public");
		setPassword("");
		setImages([]);
	};

	const MAX_TAGS = 6;

	const normalizedTags = useMemo(() => {
		return Array.from(
			new Set(
				tagsOptions.map((tag) => tag.trim()).filter((tag) => Boolean(tag)),
			),
		);
	}, [tagsOptions]);

	const filteredTags = useMemo(() => {
		if (!tagSearchInput.trim()) return normalizedTags;
		return normalizedTags.filter((tag) =>
			tag.toLowerCase().includes(tagSearchInput.toLowerCase()),
		);
	}, [normalizedTags, tagSearchInput]);

	const handleAddTag = (value: string) => {
		const normalized = normalizeTag(value);
		if (!normalized) return;
		if (tags.length >= MAX_TAGS) return;
		if (tags.includes(normalized)) {
			setTagInput("");
			return;
		}
		setTags((prev) => [...prev, normalized]);
		setTagInput("");
		setTagInputOpen(false);
		tagJustAddedRef.current = true;
	};

	const handleRemoveTag = (value: string) => {
		setTags((prev) => prev.filter((tag) => tag !== value));
	};

	const toggleTag = (value: string) => {
		if (!value) return;
		const isRemoving = tags.includes(value);
		if (!isRemoving && tags.length >= MAX_TAGS) return;
		setTags((prev) =>
			isRemoving ? prev.filter((tag) => tag !== value) : [...prev, value],
		);
	};

	const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			if (event.nativeEvent.isComposing || isComposingRef.current) return;
			event.preventDefault();
			handleAddTag(tagInput);
		}
	};

	const handleImageDialogOpen = useCallback(() => {
		if (images.length >= MAX_IMAGE_COUNT) {
			toast.error("이미지는 최대 4개까지 첨부할 수 있어요.");
			return;
		}
		imageManager.openDialog("create", images.length);
	}, [imageManager, images.length]);

	const removeImage = useCallback((id: string) => {
		imageManager.removeImage(setImages, id);
	}, [imageManager]);

	const handleImageUpload = useCallback(
		(url: string) => {
			if (!imageDialog.target || !url) return;
			if (images.length >= MAX_IMAGE_COUNT) {
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
		const isEditProtected = mode === "edit" && initialValues?.visibility === "protected";
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
					visibility: visibility as "public" | "secret" | "protected",
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

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl md:max-w-3xl w-full bg-card border-card rounded-card backdrop-blur-card p-0 overflow-hidden text-main-text gap-0">
				<DialogHeader className="p-4 border-b border-card-border">
					<DialogTitle className="text-[20px] font-semibold font-title">
						{mode === "edit" ? "메모 수정" : "새 메모"}
					</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col md:flex-row items-stretch min-h-0">
					<div className="w-full md:w-[60%] p-4 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-card-border">
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-full overflow-hidden border border-card">
								{avatarUrl ? (
									<img
										src={avatarUrl}
										alt={displayName}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-xs font-medium">
										{initial}
									</div>
								)}
							</div>
							<span className="text-sm font-semibold">{displayName}</span>
						</div>

						<div className="space-y-2">
							<label className="text-xs text-sub-text">제목</label>
							<Input
								value={titleInput}
								onChange={(e) => setTitleInput(e.target.value)}
								placeholder="제목을 입력하세요"
								className="border-card bg-card backdrop-blur-card rounded-card text-main-text"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-xs text-sub-text">내용</label>
						<Textarea
							value={contentInput}
							onChange={(e) => setContentInput(e.target.value)}
							placeholder="내용을 입력하세요"
							rows={8}
							className="resize-none"
						/>
						</div>

						<div className="flex items-center justify-between">
							<button
								type="button"
								onClick={handleImageDialogOpen}
								className="inline-flex items-center justify-center w-9 h-9 text-sub-text border border-card rounded-card hover:border-theme-primary/50 transition-colors"
								aria-label="이미지 첨부"
							>
								<ImagePlus size={14} />
							</button>

							<div className="flex items-center gap-2">
								<span className="text-xs text-sub-text">공개 설정</span>
								<Select value={visibility} onValueChange={setVisibility}>
									<SelectTrigger className="h-9 w-[100px] rounded-card border-card bg-card text-main-text text-xs">
										<SelectValue placeholder="선택" />
									</SelectTrigger>
									<SelectContent>
										{VISIBILITY_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						{visibility === "protected" && (
							<div className="space-y-2">
								<label className="text-xs text-sub-text">비밀번호</label>
								<Input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="보호글 비밀번호"
									className="border-card bg-card backdrop-blur-card rounded-card text-main-text"
								/>
							</div>
						)}
						{images.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{images.slice(0, 4).map((image) => (
									<div
										key={image.id}
										className="relative w-12 h-12 rounded-card border border-card overflow-hidden"
									>
										<img
											src={image.url}
											alt="첨부 이미지"
											className="absolute inset-0 w-full h-full object-cover"
										/>
										<button
											type="button"
											onClick={() => removeImage(image.id)}
											className="absolute top-0.5 right-0.5 rounded-full bg-black/60 text-white p-1"
											aria-label="이미지 삭제"
										>
											<X size={10} />
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					<div className="w-full md:w-[40%] p-4">
						<div className="space-y-2">
							<label className="text-xs text-sub-text">태그</label>
							<div className="space-y-3">
								<div className="relative">
									<Search
										className="absolute left-3 top-1/2 -translate-y-1/2 text-sub-text"
										size={16}
									/>
									<Input
										type="text"
										placeholder="태그 검색..."
										value={tagSearchInput}
										onChange={(event) =>
											setTagSearchInput(event.target.value)
										}
										className="pl-9 bg-card border-card rounded-card"
									/>
								</div>
								<div className="space-y-2">
									<p className="text-xs text-sub-text px-1">
										선택된 태그 ({tags.length}/{MAX_TAGS})
									</p>
									<div className="flex flex-wrap items-center gap-2">
										{tags.map((tag) => (
											<div
												key={tag}
												className="px-3 py-1.5 rounded-full text-xs font-medium bg-theme-primary/10 text-theme-primary border border-theme-primary/20 flex items-center gap-1.5"
											>
												{tag}
												<button
													type="button"
													onClick={() => handleRemoveTag(tag)}
													className="hover:bg-theme-primary/20 rounded-full p-0.5 transition-colors"
												>
													<X size={12} />
												</button>
											</div>
										))}
										{tagInputOpen ? (
											<input
												type="text"
												value={tagInput}
												onChange={(event) => setTagInput(event.target.value)}
												onCompositionStart={() => {
													isComposingRef.current = true;
												}}
												onCompositionEnd={() => {
													isComposingRef.current = false;
												}}
												onKeyDown={handleTagKeyDown}
												onBlur={() => {
													if (isComposingRef.current) return;
													if (tagJustAddedRef.current) {
														tagJustAddedRef.current = false;
														setTagInput("");
														setTagInputOpen(false);
														return;
													}
													if (tagInput.trim()) {
														handleAddTag(tagInput);
														return;
													}
													setTagInput("");
													setTagInputOpen(false);
												}}
												autoFocus
												className="h-8 w-32 flex-none rounded-full border border-card bg-card px-3 text-xs text-main-text placeholder:text-sub-text focus-visible:outline-none focus-visible:border-theme-primary focus-visible:ring-1 focus-visible:ring-theme-primary/20"
												style={{ transition: "all 0.3s ease-in-out" }}
												placeholder="새 태그"
											/>
										) : (
											<button
												type="button"
												onClick={() => setTagInputOpen(true)}
												disabled={tags.length >= MAX_TAGS}
												className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-card text-sub-text hover:border-theme-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											>
												+ 태그 추가
											</button>
										)}
									</div>
								</div>

								{filteredTags.length > 0 && (
									<div className="space-y-2">
										<p className="text-xs text-sub-text px-1">
											기존 태그에서 선택 ({tags.length}/{MAX_TAGS})
										</p>
										<ScrollArea className="h-60 pr-4">
											<div className="flex flex-wrap gap-2">
												{filteredTags.map((tag) => {
													const isSelected = tags.includes(tag);
													const canSelect =
														!isSelected && tags.length < MAX_TAGS;
													return (
														<button
															key={tag}
															type="button"
															onClick={() => {
																if (isSelected || canSelect) {
																	toggleTag(tag);
																}
															}}
															disabled={!isSelected && !canSelect}
															className={cn(
																"px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
																isSelected
																	? "bg-theme-primary/10 border-theme-primary text-theme-primary"
																	: canSelect
																		? "bg-card border-card text-main-text hover:border-theme-primary/50"
																		: "bg-card border-card text-sub-text opacity-50 cursor-not-allowed",
															)}
														>
															{tag}
														</button>
													);
												})}
											</div>
										</ScrollArea>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="p-4 border-t border-card-border flex items-center justify-between">
					<span className="text-xs text-sub-text">
						태그 {tags.length.toLocaleString()}개
					</span>
					<Button type="button" onClick={handleSubmit}>
						{mode === "edit" ? "수정" : "작성"}
					</Button>
				</DialogFooter>
				{isMounted && (
					<ImageUploadDialog
						isOpen={imageDialog.isOpen}
						onOpenChange={(open) => {
							if (!open) {
								imageDialog.closeDialog();
							} else {
								imageDialog.setIsOpen(true);
							}
						}}
						thumbnail={imageDialog.previewUrl}
						setThumbnail={imageDialog.setPreview}
						uploadMode="deferred"
						onFileSelect={(file, previewUrl) => {
							imageDialog.setMultipleFiles([file], [previewUrl]);
						}}
						onFilesSelect={(files, previewUrls) => {
							imageDialog.setMultipleFiles(files, previewUrls);
						}}
						onUpload={handleImageUpload}
						rightContent={
							<AssetGrid
								assets={assets.assets}
								loading={assets.loading}
								error={assets.error}
								selectedUrl={imageDialog.previewUrl}
								onSelect={(asset) => imageDialog.setPreview(asset.url)}
								aspectClassName="aspect-square"
								imageClassName="w-full h-full object-contain"
								gridTemplateColumns="repeat(3, minmax(0, 1fr))"
							/>
						}
						enableAssetSearch={true}
						assetSearchQuery={assets.searchQuery}
						onAssetSearchChange={assets.setSearchQuery}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
