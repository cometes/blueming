/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth/store";
import { type PhotoBoardPost } from "@/data/photoboard";
import {
	createPhotoboardPost,
	updatePhotoboardPost,
	uploadPhotoboardImage,
} from "@/queries/photoboard";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PhotoboardCreateModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (post: PhotoBoardPost) => void;
	mode?: "create" | "edit";
	post?: PhotoBoardPost | null;
}

const getInitial = (value: string) => value.trim().charAt(0).toUpperCase();

export default function PhotoboardCreateModal({
	isOpen,
	onOpenChange,
	onSubmit,
	mode = "create",
	post = null,
}: PhotoboardCreateModalProps) {
	const { user, isAuthenticated } = useAuthStore();
	const [imageUrl, setImageUrl] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [captionInput, setCaptionInput] = useState("");
	const [isDragging, setIsDragging] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const displayName = user?.displayName || "게스트";
	const avatarUrl = user?.photoURL || "";
	const isEditMode = mode === "edit";

	const resetComposer = useCallback(() => {
		setCaptionInput("");
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
	}, [imageUrl]);

	useEffect(() => {
		if (!isOpen) {
			resetComposer();
			return;
		}

		if (isEditMode && post) {
			setCaptionInput(post.caption);
			setImageUrl(post.imageUrl);
			setImageFile(null);
		}
	}, [isOpen, isEditMode, post, resetComposer]);

	useEffect(() => {
		return () => {
			if (imageUrl.startsWith("blob:")) {
				URL.revokeObjectURL(imageUrl);
			}
		};
	}, [imageUrl]);

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

	const handleSubmit = async () => {
		if (isEditMode && !post) {
			toast.error("수정할 게시글을 찾지 못했습니다.");
			return;
		}

		const trimmedCaption = captionInput.trim();

		if (!trimmedCaption) {
			toast.error("본문을 입력해주세요.");
			return;
		}
		if (!isAuthenticated || !user) {
			toast.error("로그인 후 게시할 수 있어요.");
			return;
		}
		if (!isEditMode && !imageFile) {
			toast.error("이미지를 업로드해주세요.");
			return;
		}
		if (isEditMode && !imageUrl) {
			toast.error("이미지를 입력해주세요.");
			return;
		}

		setIsProcessing(true);

		// Extract tags from caption
		let finalTags: string[] = [];
		const extracted = trimmedCaption.match(/#[^\s#]+/g);
		if (extracted) {
			finalTags = extracted.map((t) => t.slice(1));
		}

		try {
			let finalImageUrl = imageUrl;

			if (!isEditMode && imageFile) {
				finalImageUrl = await uploadPhotoboardImage(imageFile);
			}
			if (isEditMode && imageFile) {
				finalImageUrl = await uploadPhotoboardImage(imageFile);
			}

			const payload = {
				caption: trimmedCaption,
				imageUrl: finalImageUrl,
				tags: finalTags,
			};

			const resultPost = isEditMode && post
				? await updatePhotoboardPost(post.id, payload)
				: await createPhotoboardPost(payload);

			onSubmit(resultPost);
			onOpenChange(false);
		} catch (error) {
			const fallback = isEditMode
				? "게시물 수정에 실패했습니다."
				: "게시물 생성에 실패했습니다.";
			const message = error instanceof Error ? error.message : fallback;
			toast.error(message);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl md:max-w-3xl w-full bg-card border-card rounded-card backdrop-blur-card p-0 overflow-hidden text-main-text gap-0">
				<DialogHeader className="p-4 border-b border-card-border">
				<DialogTitle className="text-[20px] font-semibold font-title">
					{isEditMode ? "게시물 수정" : "새 게시물"}
				</DialogTitle>
				</DialogHeader>
				<div className="flex">
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

					{/* Right Column: Details & Post */}
					<div className="w-full md:w-[40%] flex flex-col h-full">
						<div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
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
											{getInitial(displayName)}
										</div>
									)}
								</div>
								<span className="text-sm font-semibold">{displayName}</span>
							</div>

							{/* Caption Input */}
							<div className="flex-1">
								<textarea
									value={captionInput}
									onChange={(e) => setCaptionInput(e.target.value)}
									placeholder="문구를 입력하세요..."
									className="w-full h-full min-h-[200px] resize-none bg-transparent border-none outline-none text-sm leading-relaxed placeholder:text-sub-text"
									maxLength={2200}
								/>
							</div>
						</div>

						{/* Footer */}
						<div className="p-4 border-t border-card-border flex items-center justify-between">
							<span className="text-xs text-sub-text">
								{captionInput.length.toLocaleString()} / 2,200
							</span>
							<Button
								onClick={handleSubmit}
								disabled={
									!captionInput.trim() ||
									isProcessing ||
									(!isEditMode && !imageFile) ||
									(isEditMode && !imageUrl)
								}
							>
								{isProcessing ? (
									<Loader2 size={16} className="animate-spin" />
								) : (
									isEditMode ? "저장" : "게시"
								)}
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
