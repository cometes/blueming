"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ImagePlus, Lock, MessageCircle, Send } from "lucide-react";

interface CommentSidebarProps {
	postId: string;
}

const noop = () => {};
const MAX_IMAGE_COUNT = 8;

export default function CommentSidebar({ postId }: CommentSidebarProps) {
	const totalCount = 0;
	const isLoading = false;
	const isAuthLoading = false;
	const comments: never[] = [];
	const hasMore = false;
	const cooldownRemaining = 0;
	const isSubmitting = false;
	const resolvedMode: "user" | "anon" = "anon";
	const imageCount = 0;

	return (
		<div className="flex flex-col h-full">
			{/* 헤더 */}
			<div className="flex items-center gap-2 p-4 border-b border-card-border">
				<MessageCircle size={18} className="text-theme-primary" />
				<h3 className="text-main-text font-semibold">
					댓글 {totalCount > 0 && `(${totalCount})`}
				</h3>
			</div>

			{/* 댓글 목록 */}
			<div className="flex-1 overflow-y-auto p-4 space-y-1">
				{isLoading && comments.length === 0 ? (
					<div className="space-y-3">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="flex gap-2">
								<Skeleton className="w-8 h-8 rounded-full bg-card" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-20 bg-card" />
									<Skeleton className="h-16 w-3/4 rounded-2xl bg-card" />
								</div>
							</div>
						))}
					</div>
				) : comments.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-sub-text">
						<MessageCircle size={40} className="mb-2 opacity-30" />
						<p className="text-sm">첫 번째 댓글을 남겨보세요.</p>
					</div>
				) : (
					<>
						{hasMore && (
							<div className="flex justify-center pt-4">
								<Button variant="ghost" size="sm" disabled>
									이전 댓글 더보기
								</Button>
							</div>
						)}
					</>
				)}
			</div>

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
									defaultValue=""
									className="flex-1 h-8 text-sm"
								/>
								<Input
									type="password"
									placeholder="비밀번호"
									inputMode="numeric"
									defaultValue=""
									className="w-24 h-8 text-sm"
								/>
							</div>
						)}

						{/* 메시지 입력 */}
						<div className="relative">
							<textarea
								defaultValue=""
								placeholder="메시지를 입력하세요..."
								maxLength={500}
								rows={2}
								className="w-full rounded-card border-card bg-card px-3 py-2 pr-10 text-sm text-main-text resize-none"
							/>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								disabled
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
									disabled
									className={cn(
										"inline-flex items-center justify-center w-8 h-8 rounded-card border border-card bg-card text-main-text",
										isSubmitting || imageCount >= MAX_IMAGE_COUNT
											? "opacity-60 pointer-events-none"
											: "",
									)}
									aria-label="사진 첨부"
								>
									<ImagePlus size={14} />
								</button>
								<label className="inline-flex items-center gap-1.5 text-xs text-sub-text">
									<Switch
										checked={false}
										onCheckedChange={noop}
										className="scale-75"
										disabled
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

			<span className="sr-only">{postId}</span>
		</div>
	);
}
