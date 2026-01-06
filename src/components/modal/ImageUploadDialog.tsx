/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageUploadDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	thumbnail: string;
	setThumbnail: (url: string) => void;
	onUpload: (url: string) => void;
}

export default function ImageUploadDialog({
	isOpen,
	onOpenChange,
	thumbnail,
	setThumbnail,
	onUpload,
}: ImageUploadDialogProps) {
	const [isUploading, setIsUploading] = useState(false);

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		try {
			const file = event.target.files?.[0];
			if (!file) return;

			setIsUploading(true);

			const formData = new FormData();
			formData.append("image", file);

			const response = await fetch(
				"https://api-w5buphcleq-du.a.run.app/images/uploadImage",
				{
					method: "POST",
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
		if (thumbnail) {
			onUpload(thumbnail);
			setThumbnail("");
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md bg-card-bg border-card rounded-card">
				<DialogHeader>
					<DialogTitle className="text-[20px] font-semibold">
						이미지 업로드
					</DialogTitle>
					<DialogDescription className="text-sm text-sub-text">
						이미지를 선택하고 업로드해 주세요.
					</DialogDescription>
				</DialogHeader>
				<div className="w-full max-w-sm mx-auto">
					<div className="relative w-full aspect-[4/3] min-h-[150px]">
						{thumbnail ? (
							<img
								src={thumbnail}
								alt="Preview"
								className="absolute inset-0 w-full h-full object-cover rounded-card border-card"
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

				<DialogFooter className="gap-2 sm:gap-3">
					<Button
						type="button"
						variant="outline"
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
						업로드
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
