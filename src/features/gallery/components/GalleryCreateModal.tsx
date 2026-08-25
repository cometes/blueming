/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { useAuthStore } from "@/store/auth/store";
import Avatar from "@/components/common/Avatar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TagPicker from "@/components/tag/TagPicker";
import { useTagPicker } from "@/hooks/useTagPicker";
import { uploadGalleryImage } from "@/features/gallery/api/client";
import { useSingleImageUploadField } from "@/hooks/useSingleImageUploadField";

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
	editingId?: string;
	initialValues?: { title: string; imageUrl: string; tags: string[] };
}

export default function GalleryCreateModal({
	isOpen,
	onOpenChange,
	onSubmit,
	tagsOptions = [],
	editingId,
	initialValues,
}: GalleryCreateModalProps) {
	const { user } = useAuthStore();
	const { isAuthenticated } = useAuthStore();
	const { imageUrl, imageFile, setFromFile, setFromUrl, clearImage } =
		useSingleImageUploadField();
	const [titleInput, setTitleInput] = useState("");
	const [isDragging, setIsDragging] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const tagPicker = useTagPicker({ tagsOptions, maxTags: 6 });
	const { tags, setTags, reset: resetTagPicker } = tagPicker;

	const displayName = user?.displayName || "게스트";
	const avatarUrl = user?.photoURL || "";

	const resetComposer = useCallback(() => {
		setTitleInput("");
		resetTagPicker();
		setIsDragging(false);
		setIsProcessing(false);
		clearImage();
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}, [clearImage, resetTagPicker]);

	useEffect(() => {
		if (!isOpen) {
			resetComposer();
		} else if (initialValues) {
			setTitleInput(initialValues.title);
			setTags(initialValues.tags);
			setFromUrl(initialValues.imageUrl);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("이미지 파일만 업로드할 수 있어요.");
			return;
		}

		setFromFile(file);
	};

	const handleDrop = (event: React.DragEvent) => {
		event.preventDefault();
		setIsDragging(false);
		const file = event.dataTransfer.files?.[0];
		if (file && file.type.startsWith("image/")) {
			setFromFile(file);
		} else if (file) {
			toast.error("이미지 파일만 업로드할 수 있어요.");
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
						{editingId ? "이미지 수정" : "새 갤러리 이미지"}
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
									onClick={clearImage}
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
								<Avatar
									src={avatarUrl}
									name={displayName}
									alt={displayName}
									className="h-8 w-8"
								/>
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

							<TagPicker picker={tagPicker} scrollAreaClassName="h-30 pr-4" />
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
								) : editingId ? (
									"수정"
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
