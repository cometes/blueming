/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useAuthStore } from "@/store/auth/store";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import {
	useMemoComposer,
	type MemoComposerInitialValues,
	type MemoComposerPayload,
} from "@/features/memo/hooks/useMemoComposer";
import TagPicker from "@/components/tag/TagPicker";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
	initialValues?: MemoComposerInitialValues;
	onSubmit?: (payload: MemoComposerPayload) => void | Promise<void>;
}

const VISIBILITY_OPTIONS = [
	{ value: "public", label: "전체공개" },
	{ value: "secret", label: "비밀글" },
	{ value: "protected", label: "보호글" },
];

export default function MemoCreateModal({
	isOpen,
	onOpenChange,
	tagsOptions = [],
	mode = "create",
	initialValues,
	onSubmit,
}: MemoCreateModalProps) {
	const { user } = useAuthStore();
	const [isMounted, setIsMounted] = useState(false);
	const composer = useMemoComposer({
		isOpen,
		mode,
		initialValues,
		tagsOptions,
		onOpenChange,
		onSubmit,
	});
	const { imageDialog, assets } = composer.imageManager;

	const displayName = user?.displayName || "게스트";
	const avatarUrl = user?.photoURL || "";
	const initial = displayName.trim().charAt(0).toUpperCase();

	useEffect(() => {
		setIsMounted(true);
	}, []);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl md:max-w-3xl w-full bg-card border-card rounded-card backdrop-blur-card p-0 overflow-hidden text-main-text gap-0">
				<DialogHeader className="p-4 border-b border-card-border">
					<DialogTitle className="text-[20px] font-semibold font-title">
						{mode === "edit" ? "메모 수정" : "새 메모"}
					</DialogTitle>
					<DialogDescription className="sr-only">
						{mode === "edit"
							? "기존 메모를 수정합니다. 제목, 내용, 태그, 이미지를 변경할 수 있습니다."
							: "새 메모를 작성합니다. 제목, 내용, 태그, 이미지를 입력하세요."}
					</DialogDescription>
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
								value={composer.titleInput}
								onChange={(e) => composer.setTitleInput(e.target.value)}
								placeholder="제목을 입력하세요"
								className="border-card bg-card backdrop-blur-card rounded-card text-main-text"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-xs text-sub-text">내용</label>
							<Textarea
								value={composer.contentInput}
								onChange={(e) => composer.setContentInput(e.target.value)}
								placeholder="내용을 입력하세요"
								rows={8}
								className="resize-none"
							/>
						</div>

						<div className="flex items-center justify-between">
							<button
								type="button"
								onClick={composer.handleImageDialogOpen}
								className="inline-flex items-center justify-center w-9 h-9 text-sub-text border border-card rounded-card hover:border-theme-primary/50 transition-colors"
								aria-label="이미지 첨부"
							>
								<ImagePlus size={14} />
							</button>

							<div className="flex items-center gap-2">
								<span className="text-xs text-sub-text">공개 설정</span>
								<Select
									value={composer.visibility}
									onValueChange={composer.setVisibility}
								>
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
						{composer.visibility === "protected" && (
							<div className="space-y-2">
								<label className="text-xs text-sub-text">비밀번호</label>
								<Input
									type="password"
									value={composer.password}
									onChange={(e) => composer.setPassword(e.target.value)}
									placeholder="보호글 비밀번호"
									className="border-card bg-card backdrop-blur-card rounded-card text-main-text"
								/>
							</div>
						)}
						{composer.images.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{composer.images.slice(0, 4).map((image) => (
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
											onClick={() => composer.removeImage(image.id)}
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
						<TagPicker picker={composer.tagPicker} />
					</div>
				</div>

				<DialogFooter className="p-4 border-t border-card-border flex items-center justify-between">
					<span className="text-xs text-sub-text">
						태그 {composer.tags.length.toLocaleString()}개
					</span>
					<Button type="button" onClick={composer.handleSubmit}>
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
						onUpload={composer.handleImageUpload}
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
