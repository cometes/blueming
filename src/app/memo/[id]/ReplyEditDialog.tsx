/* eslint-disable @next/next/no-img-element */
"use client";

import { ImagePlus, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CommentImage } from "@/features/comment/hooks/useCommentForm";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ReplyEditDialogProps {
	isOpen: boolean;
	onOpen: () => void;
	onClose: () => void;
	message: string;
	onMessageChange: (value: string) => void;
	images: CommentImage[];
	isSubmitting: boolean;
	onOpenImageDialog: () => void;
	onRemoveImage: (id: string) => void;
	onSubmit: () => void;
}

/** 메모 답글 수정 다이얼로그 */
export default function ReplyEditDialog({
	isOpen,
	onOpen,
	onClose,
	message,
	onMessageChange,
	images,
	isSubmitting,
	onOpenImageDialog,
	onRemoveImage,
	onSubmit,
}: ReplyEditDialogProps) {
	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					onClose();
				} else {
					onOpen();
				}
			}}
		>
			<DialogContent className="max-w-lg w-full bg-card border-card rounded-card backdrop-blur-card text-main-text">
				<DialogHeader>
					<DialogTitle className="text-base font-semibold">
						답글 수정
					</DialogTitle>
					<DialogDescription className="text-xs text-sub-text">
						답글 내용을 수정하고 이미지를 다시 첨부할 수 있어요.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-3">
					<Textarea
						value={message}
						onChange={(e) => onMessageChange(e.target.value)}
						placeholder="메시지를 입력하세요..."
						rows={4}
						className="resize-none"
					/>
					<div className="flex items-center justify-between">
						<button
							type="button"
							onClick={onOpenImageDialog}
							disabled={isSubmitting}
							className={cn(
								"inline-flex items-center justify-center w-8 h-8 rounded-card border border-card bg-card text-main-text",
								isSubmitting ? "opacity-60 pointer-events-none" : "",
							)}
							aria-label="사진 첨부"
						>
							<ImagePlus size={14} />
						</button>
						{images.length > 0 && (
							<span className="text-xs text-sub-text">{images.length}/4</span>
						)}
					</div>
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
										onClick={() => onRemoveImage(image.id)}
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
				<DialogFooter className="gap-2">
					<Button type="button" variant="ghost" onClick={onClose}>
						취소
					</Button>
					<Button type="button" onClick={onSubmit}>
						수정
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
