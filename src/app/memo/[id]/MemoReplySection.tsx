"use client";

import { ImagePlus, MoreHorizontal, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { dateTimeConvert } from "@/shared/lib/date";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MemoReply } from "@/features/memo/types";
import type { CommentImage } from "@/features/comment/hooks/useCommentForm";
import type { RefObject } from "react";

interface MemoReplySectionProps {
	replies: MemoReply[];
	isOwner: boolean;
	isAuthLoading: boolean;
	currentUserId: string | undefined | null;
	message: string;
	images: CommentImage[];
	isSubmitting: boolean;
	canSubmit: boolean;
	messageRef: RefObject<HTMLTextAreaElement | null>;
	onMessageChange: (value: string) => void;
	onCreateReply: () => void;
	onOpenImageDialog: (target: "create" | "edit") => void;
	onRemoveImage: (id: string) => void;
	onOpenImageModal: (urls: string[], index: number) => void;
	onOpenEditReply: (reply: { id: string; content: string; imageUrls?: string[] }) => void;
	onDeleteReply: (replyId: string) => void;
}

export default function MemoReplySection({
	replies,
	isOwner,
	isAuthLoading,
	currentUserId,
	message,
	images,
	isSubmitting,
	canSubmit,
	messageRef,
	onMessageChange,
	onCreateReply,
	onOpenImageDialog,
	onRemoveImage,
	onOpenImageModal,
	onOpenEditReply,
	onDeleteReply,
}: MemoReplySectionProps) {
	return (
		<>
			{replies.length > 0 && (
				<div>
					{replies.map((reply) => {
						const canManageReply =
							Boolean(reply.author?.id) && currentUserId === reply.author?.id;
						return (
							<div key={reply.id} className="p-5 border-t border-card-border">
								<div className="flex items-center justify-between text-sm text-sub-text">
									<div className="flex items-center gap-2.5">
										<div className="w-8 h-8 rounded-full overflow-hidden border border-card">
											{reply.author?.avatarUrl ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={reply.author.avatarUrl}
													alt={reply.author?.name ?? "작성자"}
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center text-xs font-medium">
													{reply.author?.name?.charAt(0) ?? "?"}
												</div>
											)}
										</div>
										<span>{reply.author?.name ?? "게스트"}</span>
										<span>
											{reply.createdAt ? dateTimeConvert(reply.createdAt) : ""}
										</span>
									</div>
									{canManageReply && (
										<DropdownMenu modal={false}>
											<DropdownMenuTrigger asChild>
												<button
													type="button"
													className="w-8 h-8 rounded-full flex items-center justify-center text-sub-text hover:text-main-text hover:bg-card-bg"
													aria-label="답글 메뉴"
												>
													<MoreHorizontal size={18} />
												</button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onSelect={() =>
														onOpenEditReply({
															id: reply.id,
															content: reply.content,
															imageUrls: reply.imageUrls,
														})
													}
												>
													수정하기
												</DropdownMenuItem>
												<DropdownMenuItem
													className="text-red-400"
													onSelect={() => onDeleteReply(reply.id)}
												>
													삭제하기
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									)}
								</div>
								<div className="text-sm text-main-text whitespace-pre-line leading-relaxed mt-2.5">
									{reply.content}
								</div>
								{reply.imageUrls && (reply.imageUrls?.length ?? 0) > 0 && (
									<div
										className={cn(
											"grid gap-2 mt-3",
											(reply.imageUrls?.length ?? 0) === 1 && "grid-cols-1",
											(reply.imageUrls?.length ?? 0) === 2 && "grid-cols-2",
											(reply.imageUrls?.length ?? 0) >= 3 &&
												"grid-cols-2 grid-rows-2",
										)}
									>
										{reply.imageUrls.slice(0, 4).map((url, index) => (
											<button
												key={`${reply.id}-${index}`}
												type="button"
												onClick={() =>
													onOpenImageModal(reply.imageUrls ?? [], index)
												}
												className={cn(
													"relative rounded-lg border border-card overflow-hidden text-left",
													(reply.imageUrls?.length ?? 0) === 1
														? "aspect-[4/3]"
														: "aspect-square",
													(reply.imageUrls?.length ?? 0) === 3 &&
														index === 0 &&
														"row-span-2",
												)}
												aria-label={`이미지 ${index + 1} 확대 보기`}
											>
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img
													src={url}
													alt="첨부 이미지"
													className="absolute inset-0 w-full h-full object-cover"
												/>
											</button>
										))}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{replies.length === 0 && !isOwner && (
				<>
					<hr className="border-card-border" />
					<div className="p-6 text-center text-sub-text">
						아직 답글이 없습니다.
					</div>
				</>
			)}

			{isOwner && (
				<div className="border-t border-card-border p-3 bg-card-bg">
					{isAuthLoading ? (
						<div className="text-xs text-sub-text">로딩 중...</div>
					) : (
						<div className="space-y-2">
							<div className="relative">
								<Textarea
									ref={messageRef}
									value={message}
									onChange={(e) => onMessageChange(e.target.value)}
									placeholder="메시지를 입력하세요..."
									rows={2}
									className="w-full pr-10 resize-none overflow-hidden"
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey && canSubmit) {
											e.preventDefault();
											onCreateReply();
										}
									}}
								/>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									onClick={onCreateReply}
									disabled={!canSubmit || isSubmitting}
									className="absolute right-1 bottom-1 w-8 h-8 p-0"
								>
									<Send size={16} className="text-theme-primary" />
								</Button>
							</div>

							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => onOpenImageDialog("create")}
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
										<span className="text-xs text-sub-text">
											{images.length}/4
										</span>
									)}
								</div>
							</div>

							{images.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{images.slice(0, 4).map((image) => (
										<div
											key={image.id}
											className="relative w-12 h-12 rounded-card border border-card overflow-hidden"
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
					)}
				</div>
			)}
		</>
	);
}
