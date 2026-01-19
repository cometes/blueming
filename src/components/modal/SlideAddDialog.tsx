/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { useFileUpload } from "@/hooks/useFileUpload";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SlideAddDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onAdd: (data: { image: string; url: string; target: boolean }) => void;
}

export default function SlideAddDialog({
	isOpen,
	onOpenChange,
	onAdd,
}: SlideAddDialogProps) {
	const { uploadFile, state: uploadState } = useFileUpload();
	const [image, setImage] = useState("");
	const [url, setUrl] = useState("");
	const [target, setTarget] = useState(false);
	const [pendingImage, setPendingImage] = useState<{
		file: File;
		previewUrl: string;
	} | null>(null);

	useEffect(() => {
		if (!isOpen) {
			if (pendingImage) {
				URL.revokeObjectURL(pendingImage.previewUrl);
			}
			setImage("");
			setUrl("");
			setTarget(false);
			setPendingImage(null);
		}
	}, [isOpen, pendingImage]);

	useEffect(() => {
		return () => {
			if (pendingImage) {
				URL.revokeObjectURL(pendingImage.previewUrl);
			}
		};
	}, [pendingImage]);

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		if (pendingImage) {
			URL.revokeObjectURL(pendingImage.previewUrl);
		}
		const previewUrl = URL.createObjectURL(file);
		setPendingImage({ file, previewUrl });
		setImage(previewUrl);
		event.target.value = "";
	};

	const handleAdd = async () => {
		if (!pendingImage) {
			toast.error("이미지를 업로드해주세요.");
			return;
		}
		try {
			const uploadedUrl = await uploadFile(pendingImage.file);
			onAdd({ image: uploadedUrl, url, target });
			URL.revokeObjectURL(pendingImage.previewUrl);
			setPendingImage(null);
			setImage("");
			setUrl("");
			setTarget(false);
			onOpenChange(false);
		} catch {
			toast.error("이미지 업로드 중 오류가 발생했습니다.");
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl w-full bg-card-bg border-card rounded-card backdrop-blur-card">
				<DialogHeader>
					<DialogTitle className="text-[20px] font-semibold">
						슬라이드 추가하기
					</DialogTitle>
				</DialogHeader>

				<div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
					<div className="w-full">
						<div className="relative w-full aspect-[13/5] rounded-card overflow-hidden bg-card-bg ring-1 ring-[var(--color-card-border)] ring-inset">
							{image ? (
								<img
									src={image}
									alt="슬라이드 이미지"
									className="absolute inset-0 w-full h-full object-contain"
								/>
							) : (
								<div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-card-bg">
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
								onChange={handleFileSelect}
								disabled={uploadState.loading}
								className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
							/>
						</div>
					</div>

					<div className="w-full space-y-4 min-w-0">
						<div className="space-y-2">
							<Label className="text-xs font-medium text-sub-text">
								링크 URL
							</Label>
							<Input
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder="url을 입력하세요 (선택)"
								className="rounded-card border-card bg-card-bg"
							/>
						</div>

						<div className="flex items-center space-x-2">
							<Checkbox
								id="slide-new-tab"
								checked={target}
								onCheckedChange={(checked) => setTarget(Boolean(checked))}
							/>
							<Label
								htmlFor="slide-new-tab"
								className="cursor-pointer text-sm text-sub-text"
							>
								새 탭에서 열기
							</Label>
						</div>
					</div>
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
						onClick={handleAdd}
						disabled={!image || uploadState.loading}
						className="w-full sm:w-auto"
					>
						<Upload size={14} className="mr-2" />
						추가
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
