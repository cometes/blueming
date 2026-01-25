/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ImagePlus, Upload, Search } from "lucide-react";
import { toast } from "sonner";
import { getAuthHeader } from "@/queries/getAuthHeader";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImageUploadDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	thumbnail: string;
	setThumbnail: (url: string) => void;
	onUpload: (url: string) => void;
	uploadMode?: "immediate" | "deferred";
	onFileSelect?: (file: File, previewUrl: string) => void;
	rightContent?: ReactNode;
	enableAssetSearch?: boolean;
	assetSearchQuery?: string;
	onAssetSearchChange?: (query: string) => void;
}

export default function ImageUploadDialog({
	isOpen,
	onOpenChange,
	thumbnail,
	setThumbnail,
	onUpload,
	uploadMode = "immediate",
	onFileSelect,
	rightContent,
	enableAssetSearch = false,
	assetSearchQuery = "",
	onAssetSearchChange,
}: ImageUploadDialogProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [internalSearchQuery, setInternalSearchQuery] = useState("");

	const isControlledSearch = typeof onAssetSearchChange === "function";
	const searchQuery = enableAssetSearch
		? isControlledSearch
			? assetSearchQuery ?? ""
			: internalSearchQuery
		: "";

	const handleSearchChange = (value: string) => {
		if (onAssetSearchChange) {
			onAssetSearchChange(value);
		} else {
			setInternalSearchQuery(value);
		}
	};

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		try {
			const file = event.target.files?.[0];
			if (!file) return;

			if (uploadMode === "deferred") {
				const previewUrl = URL.createObjectURL(file);
				setThumbnail(previewUrl);
				onFileSelect?.(file, previewUrl);
				return;
			}

			setIsUploading(true);

			const formData = new FormData();
			formData.append("image", file);

			const authHeader = await getAuthHeader();
			const response = await fetch(
				"https://api-w5buphcleq-du.a.run.app/images/uploadImage",
				{
					method: "POST",
					headers: authHeader,
					body: formData,
				}
			);

			if (!response.ok) {
				throw new Error("Upload failed");
			}

			const data = await response.json();
			const url = data.file?.url;

			if (url) {
				setThumbnail(url);
			} else {
				toast.error("URL이 반환되지 않았습니다.");
			}
		} catch {
			toast.error("이미지 업로드 중 오류가 발생했습니다.");
		} finally {
			setIsUploading(false);
		}
	};

	const handleUpload = () => {
		if (!thumbnail) return;

		onUpload(thumbnail);

		if (uploadMode === "immediate") {
			setThumbnail("");
		}

		onOpenChange(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent
				className={[
					"bg-card-bg border-card rounded-card backdrop-blur-card w-full",
					rightContent ? "max-w-2xl sm:max-w-2xl" : "max-w-md sm:max-w-md",
				].join(" ")}
			>
				<DialogHeader>
					<DialogTitle className="text-[20px] font-semibold">
						이미지 업로드
					</DialogTitle>
					<DialogDescription className="text-sm text-sub-text">
						이미지를 선택하고 업로드해 주세요.
					</DialogDescription>
				</DialogHeader>
				<div
					className={[
						"grid gap-4",
						rightContent ? "grid-cols-2" : "grid-cols-1",
					].join(" ")}
				>
					<div>
						<div className="text-xs font-semibold text-main-text mb-2">
							파일 업로드
						</div>
						<div className="relative w-full aspect-video">
							{thumbnail ? (
								<img
									src={thumbnail}
									alt="Preview"
									className="absolute inset-0 w-full h-full object-contain rounded-card border-card"
								/>
							) : (
								<div className="absolute inset-0 w-full h-full border-2 border-dashed border-card rounded-card flex flex-col items-center justify-center bg-card-bg">
									<ImagePlus
										size={28}
										className="text-sub-text mb-2"
										absoluteStrokeWidth={true}
									/>
									<p className="text-sm text-sub-text">Upload Image</p>
								</div>
							)}
							<input
								type="file"
								accept="image/*"
								onChange={handleFileUpload}
								disabled={isUploading}
								className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
							/>
						</div>
					</div>
					{rightContent ? (
						<div className="min-w-0 flex flex-col">
							{enableAssetSearch && (
								<div className="mb-3">
									<div className="relative">
										<Search
											size={16}
											className="absolute left-3 top-1/2 -translate-y-1/2 text-sub-text"
										/>
										<Input
											type="text"
											placeholder="에셋 검색..."
											value={searchQuery}
											onChange={(e) => handleSearchChange(e.target.value)}
											className="pl-9 rounded-card border-card bg-card-bg"
										/>
									</div>
								</div>
							)}
							<ScrollArea className="flex-1 max-h-[400px]">
								<div className="pr-4">{rightContent}</div>
							</ScrollArea>
						</div>
					) : null}
				</div>

				<DialogFooter className="gap-2 sm:gap-3">
					<Button
						type="button"
						variant="ghost"
						onClick={() => onOpenChange(false)}
					>
						취소
					</Button>
					<Button
						onClick={handleUpload}
						disabled={!thumbnail || isUploading}
						className="w-full sm:w-auto"
					>
						<Upload size={14} className="mr-2" />
						{uploadMode === "deferred" ? "선택" : "업로드"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
