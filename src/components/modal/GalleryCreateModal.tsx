"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth/store";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uploadGalleryImage } from "@/queries/gallery";

export interface GalleryCreatePayload {
	imageUrl: string;
	title: string;
	tags: string[];
}

interface GalleryCreateModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (payload: GalleryCreatePayload) => void;
	tagsOptions?: string[];
}

const normalizeTag = (value: string) =>
	value.replace(/^#/, "").replace(/\s+/g, "").trim();

export default function GalleryCreateModal({
	isOpen,
	onOpenChange,
	onSubmit,
	tagsOptions = [],
}: GalleryCreateModalProps) {
	const { user } = useAuthStore();
	const { isAuthenticated } = useAuthStore();
	const [imageUrl, setImageUrl] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [titleInput, setTitleInput] = useState("");
	const [tagInput, setTagInput] = useState("");
	const [tagSearchInput, setTagSearchInput] = useState("");
	const [tagInputOpen, setTagInputOpen] = useState(false);
	const [tags, setTags] = useState<string[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const tagJustAddedRef = useRef(false);
	const isComposingRef = useRef(false);

	const displayName = user?.displayName || "게스트";
	const avatarUrl = user?.photoURL || "";
	const initial = displayName.trim().charAt(0).toUpperCase();

	useEffect(() => {
		if (!isOpen) {
			resetComposer();
		}
	}, [isOpen]);

	useEffect(() => {
		return () => {
			if (imageUrl.startsWith("blob:")) {
				URL.revokeObjectURL(imageUrl);
			}
		};
	}, [imageUrl]);

	const resetComposer = () => {
		setTitleInput("");
		setTagInput("");
		setTagSearchInput("");
		setTagInputOpen(false);
		setTags([]);
		setIsDragging(false);
		setIsProcessing(false);
		setImageFile(null);
		if (imageUrl.startsWith("blob:")) {
			URL.revokeObjectURL(imageUrl);
		}
		setImageUrl("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
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

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("이미지 파일만 업로드할 수 있어요.");
			return;
		}

		if (imageUrl.startsWith("blob:")) {
			URL.revokeObjectURL(imageUrl);
		}
		const previewUrl = URL.createObjectURL(file);
		setImageUrl(previewUrl);
		setImageFile(file);
	};

	const handleDrop = (event: React.DragEvent) => {
		event.preventDefault();
		setIsDragging(false);
		const file = event.dataTransfer.files?.[0];
		if (file && file.type.startsWith("image/")) {
			if (imageUrl.startsWith("blob:")) {
				URL.revokeObjectURL(imageUrl);
			}
			const previewUrl = URL.createObjectURL(file);
			setImageUrl(previewUrl);
			setImageFile(file);
		} else if (file) {
			toast.error("이미지 파일만 업로드할 수 있어요.");
		}
	};

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

	const handleSubmit = async () => {
		if (!imageFile && !imageUrl) {
			toast.error("이미지를 업로드해주세요.");
			return;
		}

		const trimmedTitle = titleInput.trim() || "갤러리 이미지";

		if (!isAuthenticated || !user) {
			toast.error("로그인 후 게시할 수 있어요.");
			return;
		}

		setIsProcessing(true);
		try {
			let finalImageUrl = imageUrl;
			if (imageFile) {
				finalImageUrl = await uploadGalleryImage(imageFile);
			}

			onSubmit({
				imageUrl: finalImageUrl,
				title: trimmedTitle,
				tags,
			});
			onOpenChange(false);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "이미지 업로드에 실패했습니다.";
			toast.error(message);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl md:max-w-3xl w-full bg-card border-card rounded-card backdrop-blur-card p-0 overflow-hidden text-main-text gap-0 h-[570px] max-h-[570px] flex flex-col">
				<DialogHeader className="p-4 border-b border-card-border shrink-0">
					<DialogTitle className="text-[20px] font-semibold font-title">
						새 갤러리 이미지
					</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col md:flex-row items-stretch flex-1 min-h-0">
					{/* Left Column: Image Upload/Preview */}
					<div
						className={cn(
							"w-full md:w-[60%] aspect-square flex items-center justify-center relative transition-colors border-r border-card-border",
							isDragging && "bg-theme-primary/10",
						)}
						onDragOver={(e) => {
							e.preventDefault();
							setIsDragging(true);
						}}
						onDragLeave={() => setIsDragging(false)}
						onDrop={handleDrop}
					>
						{imageUrl ? (
							<div className="relative w-full h-full flex items-center justify-center group API-image-container">
								<img
									src={imageUrl}
									alt="Preview"
									className="w-full h-full object-cover"
								/>
								<button
									onClick={() => {
										setImageUrl("");
										setImageFile(null);
									}}
									className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
									title="이미지 제거"
								>
									<X size={20} />
								</button>
							</div>
						) : (
							<div className="flex flex-col items-center gap-4 p-8 text-center">
								<div className="w-16 h-16 rounded-full bg-card flex items-center justify-center border border-card">
									<ImagePlus size={32} className="text-sub-text" />
								</div>
								<div>
									<h3 className="text-lg font-semibold">사진 업로드</h3>
									<p className="text-sm text-sub-text mt-1">
										여기에 이미지를 끌어다 놓거나 선택하세요
									</p>
								</div>
								<label className="mt-2">
									<Button
										variant="default"
										className="cursor-pointer"
										onClick={() => fileInputRef.current?.click()}
									>
										컴퓨터에서 선택
									</Button>
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										onChange={handleImageChange}
										className="hidden"
									/>
								</label>
							</div>
						)}
					</div>

					{/* Right Column: Details */}
					<div className="w-full md:w-[40%] flex flex-col flex-1 min-h-0 overflow-hidden">
						<div className="p-4 flex-1 flex flex-col gap-4 min-h-0">
							{/* User Profile */}
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 rounded-full overflow-hidden">
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
											<ScrollArea className="h-30 pr-4">
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

						{/* Footer */}
						<div className="p-4 border-t border-card-border flex items-center justify-between mt-auto">
							<span className="text-xs text-sub-text">
								태그 {tags.length.toLocaleString()}개
							</span>
							<Button
								onClick={handleSubmit}
								disabled={isProcessing || (!imageFile && !imageUrl)}
							>
								{isProcessing ? (
									<Loader2 size={16} className="animate-spin" />
								) : (
									"게시"
								)}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
