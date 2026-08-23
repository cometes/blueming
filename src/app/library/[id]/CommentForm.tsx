"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { ImagePlus, Lock, Send } from "lucide-react";
import type { CommentImage } from "@/features/comment/hooks/useCommentForm";
import MentionTextarea from "@/components/common/MentionTextarea";
import type { MentionEntry } from "@/features/mention/types";

const MAX_IMAGE_COUNT = 8;

interface CommentFormProps {
	isAuthLoading: boolean;
	resolvedMode: "user" | "anon";
	displayName: string;
	onDisplayNameChange: (value: string) => void;
	pin: string;
	onPinChange: (value: string) => void;
	message: string;
	onMessageChange: (value: string) => void;
	mentions: MentionEntry[];
	onMentionsChange: (mentions: MentionEntry[]) => void;
	isSecret: boolean;
	onIsSecretChange: (value: boolean) => void;
	images: CommentImage[];
	isSubmitting: boolean;
	canSubmit: boolean;
	cooldownRemaining: number;
	onSubmit: () => void;
	onOpenImageDialog: () => void;
	onRemoveImage: (id: string) => void;
}

export default function CommentForm({
	isAuthLoading,
	resolvedMode,
	displayName,
	onDisplayNameChange,
	pin,
	onPinChange,
	message,
	onMessageChange,
	mentions,
	onMentionsChange,
	isSecret,
	onIsSecretChange,
	images,
	isSubmitting,
	canSubmit,
	cooldownRemaining,
	onSubmit,
	onOpenImageDialog,
	onRemoveImage,
}: CommentFormProps) {
	return (
		<>
			{/* 입력 영역 */}
			<div className="border-t border-card-border p-3 bg-card-bg">
				{isAuthLoading ? (
					<div className="space-y-2">
						<Skeleton className="h-9 w-full rounded-card bg-card" />
						<Skeleton className="h-20 w-full rounded-card bg-card" />
					</div>
				) : (
					<div className="space-y-2">
						{/* 익명 입력 필드 */}
						{resolvedMode === "anon" && (
							<div className="flex gap-1.5">
								<Input
									type="text"
									placeholder="닉네임"
									value={displayName}
									onChange={(e) => onDisplayNameChange(e.target.value)}
									className="flex-1 h-8 text-sm"
								/>
								<Input
									type="password"
									placeholder="비밀번호"
									inputMode="numeric"
									value={pin}
									onChange={(e) => onPinChange(e.target.value)}
									className="w-24 h-8 text-sm"
								/>
							</div>
						)}

						{/* 메시지 입력 */}
						<div className="relative">
							<MentionTextarea
								value={message}
								onValueChange={onMessageChange}
								mentions={mentions}
								onMentionsChange={onMentionsChange}
								placeholder="메시지를 입력하세요... (@로 회원 언급)"
								maxLength={500}
								rows={2}
								className="w-full rounded-card border-card bg-card px-3 py-2 pr-10 text-sm text-main-text resize-none"
								onKeyDown={(e) => {
									if (
										e.key === "Enter" &&
										(e.ctrlKey || e.metaKey) &&
										canSubmit
									) {
										e.preventDefault();
										onSubmit();
									}
								}}
							/>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={onSubmit}
								disabled={!canSubmit || isSubmitting}
								className="absolute right-1 bottom-1 w-8 h-8 p-0"
							>
								<Send size={16} className="text-theme-primary" />
							</Button>
						</div>

						{/* 하단 옵션 */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={onOpenImageDialog}
									disabled={
										isSubmitting || images.length >= MAX_IMAGE_COUNT
									}
									className={cn(
										"inline-flex items-center justify-center w-8 h-8 rounded-card border border-card bg-card text-main-text",
										isSubmitting || images.length >= MAX_IMAGE_COUNT
											? "opacity-60 pointer-events-none"
											: "",
									)}
									aria-label="사진 첨부"
								>
									<ImagePlus size={14} />
								</button>
								{images.length > 0 && (
									<span className="text-xs text-sub-text">
										{images.length}/{MAX_IMAGE_COUNT}
									</span>
								)}
								<label className="inline-flex items-center gap-1.5 text-xs text-sub-text">
									<Switch
										checked={isSecret}
										onCheckedChange={onIsSecretChange}
										className="scale-75"
									/>
									<Lock size={12} />
									비밀글
								</label>
							</div>
							{cooldownRemaining > 0 && (
								<span className="text-xs text-sub-text">
									{cooldownRemaining}초
								</span>
							)}
						</div>
					</div>
				)}
			</div>

			{/* 첨부 이미지 미리보기 */}
			{images.length > 0 && (
				<div className="px-3 pb-3 bg-card-bg border-t border-card-border">
					<div className="flex flex-wrap gap-1.5">
						{images.map((image) => (
							<div
								key={image.id}
								className="relative w-14 h-14 rounded-lg border border-card overflow-hidden"
							>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={image.url}
									alt="첨부 이미지"
									className="absolute inset-0 w-full h-full object-cover"
								/>
								<button
									type="button"
									onClick={() => onRemoveImage(image.id)}
									className="absolute top-0.5 right-0.5 rounded-full bg-black/60 text-white text-[8px] px-1.5 py-0.5"
								>
									X
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</>
	);
}
