"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";
import CommentItem from "@/features/library/components/CommentItem";
import type { LibraryComment as Comment } from "@/features/library/types";

interface CommentListProps {
	comments: Comment[];
	isLoading: boolean;
	hasMore: boolean;
	onLoadMore: () => void;
	onToggleSecret: (comment: Comment, pinValue: string) => void;
	onEdit: (comment: Comment) => void;
	onDelete: (comment: Comment) => void;
}

export default function CommentList({
	comments,
	isLoading,
	hasMore,
	onLoadMore,
	onToggleSecret,
	onEdit,
	onDelete,
}: CommentListProps) {
	if (isLoading && comments.length === 0) {
		return (
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
		);
	}

	if (comments.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-sub-text">
				<MessageCircle size={40} className="mb-2 opacity-30" />
				<p className="text-sm">첫 번째 댓글을 남겨보세요.</p>
			</div>
		);
	}

	return (
		<>
			{comments.map((comment) => (
				<CommentItem
					key={comment.id}
					comment={comment}
					isOwn={comment.isOwn === true}
					onToggleSecret={(pinValue) => onToggleSecret(comment, pinValue)}
					onEdit={
						comment.canEdit ? () => onEdit(comment) : undefined
					}
					onDelete={
						comment.canDelete ? () => onDelete(comment) : undefined
					}
				/>
			))}
			{hasMore && (
				<div className="flex justify-center pt-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={onLoadMore}
						disabled={isLoading}
					>
						{isLoading ? "로딩 중..." : "이전 댓글 더보기"}
					</Button>
				</div>
			)}
		</>
	);
}
