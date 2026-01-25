"use client";

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
import { Switch } from "@/components/ui/switch";
import { Lock, ImagePlus } from "lucide-react";

interface CommentEditDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode: "edit" | "delete";
	isAnon: boolean;
	isAdmin: boolean;
	dialogPin: string;
	onDialogPinChange: (value: string) => void;
	dialogMessage: string;
	onDialogMessageChange: (value: string) => void;
	dialogSecret: boolean;
	onDialogSecretChange: (value: boolean) => void;
	dialogImages: { id: string; url: string }[];
	onRemoveDialogImage: (id: string) => void;
	onOpenImageDialog: () => void;
	onClose: () => void;
	onConfirm: () => void;
}

export default function CommentEditDialog({
	open,
	onOpenChange,
	mode,
	isAnon,
	isAdmin,
	dialogPin,
	onDialogPinChange,
	dialogMessage,
	onDialogMessageChange,
	dialogSecret,
	onDialogSecretChange,
	dialogImages,
	onRemoveDialogImage,
	onOpenImageDialog,
	onClose,
	onConfirm,
}: CommentEditDialogProps) {
	const pinRequired = isAnon && !isAdmin;
	const canConfirm = pinRequired ? /^\d{4}$/.test(dialogPin) : true;
	const isAtLimit = dialogImages.length >= 8;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-md sm:max-w-md w-full bg-card-bg border-card rounded-card backdrop-blur-card"
				onOpenAutoFocus={(event) => event.preventDefault()}
			>
				<DialogHeader className="gap-2">
					<DialogTitle className="text-[20px] font-semibold text-main-text">
						{mode === "edit" ? "댓글 수정" : "댓글 삭제"}
					</DialogTitle>
					<DialogDescription className="text-sm text-sub-text">
						{mode === "edit"
							? "내용을 수정하고 저장하세요."
							: "정말 이 댓글을 삭제할까요?"}
					</DialogDescription>
				</DialogHeader>

				{pinRequired && (
					<Input
						type="password"
						placeholder="비밀번호 4자리"
						inputMode="numeric"
						value={dialogPin}
						onChange={(e) => onDialogPinChange(e.target.value)}
					/>
				)}

				{mode === "edit" && (
					<>
						<textarea
							value={dialogMessage}
							onChange={(e) => onDialogMessageChange(e.target.value)}
							maxLength={500}
							className="w-full min-h-[120px] rounded-card border-card bg-card-bg px-3 py-2 text-sm text-main-text resize-none"
						/>
						<label className="inline-flex items-center gap-2 text-sm text-sub-text mt-2">
							<Switch
								checked={dialogSecret}
								onCheckedChange={onDialogSecretChange}
							/>
							<Lock size={14} />
							비밀글
						</label>
						<div className="flex flex-wrap items-center gap-3 mt-3">
							<button
								type="button"
								onClick={onOpenImageDialog}
								disabled={isAtLimit}
								className="inline-flex items-center justify-center w-9 h-9 rounded-card border border-card bg-card-bg text-main-text disabled:opacity-60 disabled:pointer-events-none"
								aria-label="사진 변경"
							>
								<ImagePlus size={16} />
							</button>
							<span className="text-xs text-sub-text">
								{dialogImages.length}/8
							</span>
						</div>
						{dialogImages.length > 0 && (
							<div className="grid grid-cols-4 gap-1.5 mt-3">
								{dialogImages.map((image) => (
									<div
										key={image.id}
										className="relative aspect-square rounded-card border-card bg-card-bg overflow-hidden"
									>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={image.url}
											alt="첨부 이미지"
											className="absolute inset-0 w-full h-full object-cover"
										/>
										<button
											type="button"
											onClick={() => onRemoveDialogImage(image.id)}
											className="absolute top-1 right-1 rounded-full bg-black/60 text-white text-[10px] px-2 py-0.5"
										>
											삭제
										</button>
									</div>
								))}
							</div>
						)}
					</>
				)}

				<DialogFooter className="gap-2 sm:gap-3">
					<Button type="button" variant="ghost" onClick={onClose}>
						취소
					</Button>
					{mode === "edit" ? (
						<Button type="button" onClick={onConfirm} disabled={!canConfirm}>
							저장
						</Button>
					) : (
						<Button
							type="button"
							variant="destructive"
							onClick={onConfirm}
							disabled={!canConfirm}
						>
							삭제
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
