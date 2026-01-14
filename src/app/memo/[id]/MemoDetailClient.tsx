"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, ChevronUp, Heart, ThumbsUp, MessageCircle } from "lucide-react";
import { useState } from "react";

type MemoReply = {
	id: string;
	content: string;
	author: string;
	createdAt: string;
	reactions?: {
		hearts: number;
		likes: number;
		comments: number;
	};
};

type Memo = {
	id: string;
	title: string;
	content: string;
	author: string;
	tags?: string[];
	createdAt: string;
	replies: MemoReply[];
};

interface MemoDetailClientProps {
	memo: Memo;
}

export default function MemoDetailClient({ memo }: MemoDetailClientProps) {
	const router = useRouter();
	const [isRepliesExpanded, setIsRepliesExpanded] = useState(true);

	return (
		<div className="w-full max-w-[800px] mx-auto px-4 py-10">
			{/* 뒤로가기 버튼 */}
			<Button
				variant="outline"
				size="sm"
				onClick={() => router.back()}
				className="mb-6 gap-2"
			>
				<ArrowLeft size={16} />
				목록 가기
			</Button>

			{/* 메인 메모 카드 */}
			<article className="rounded-card border border-card bg-card-bg p-6 mb-6">
				{/* 태그 배지 */}
				{memo.tags && memo.tags.length > 0 && (
					<div className="flex flex-wrap gap-1.5 mb-4">
						{memo.tags.map((tag, idx) => (
							<span
								key={idx}
								className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20"
							>
								{tag}
							</span>
						))}
					</div>
				)}

				{/* 제목 */}
				<h1 className="text-2xl font-bold text-main-text mb-3">
					{memo.title}
				</h1>

				{/* 작성자 및 날짜 */}
				<div className="flex items-center justify-between text-sm text-sub-text mb-4 pb-4 border-b border-card">
					<span>{memo.author}</span>
					<span>{memo.createdAt}</span>
				</div>

				{/* 본문 */}
				<div className="text-sm text-main-text whitespace-pre-line leading-relaxed">
					{memo.content}
				</div>
			</article>

			{/* 답글 섹션 */}
			{memo.replies.length > 0 && (
				<div className="rounded-card border border-card bg-card-bg overflow-hidden">
					{/* 답글 헤더 */}
					<button
						onClick={() => setIsRepliesExpanded(!isRepliesExpanded)}
						className="w-full px-6 py-4 flex items-center justify-between bg-card-bg hover:bg-card transition-colors border-b border-card"
					>
						<h2 className="text-base font-semibold text-main-text">
							전체 ({memo.replies.length})
						</h2>
						{isRepliesExpanded ? (
							<ChevronUp size={20} className="text-sub-text" />
						) : (
							<ChevronDown size={20} className="text-sub-text" />
						)}
					</button>

					{/* 답글 목록 */}
					{isRepliesExpanded && (
						<div className="divide-y divide-card">
							{memo.replies.map((reply) => (
								<div key={reply.id} className="p-6 hover:bg-card/50 transition-colors">
									{/* 답글 작성자 및 날짜 */}
									<div className="flex items-center justify-between mb-3">
										<span className="text-sm font-medium text-main-text">
											{reply.author}
										</span>
										<span className="text-xs text-sub-text">
											{reply.createdAt}
										</span>
									</div>

									{/* 답글 내용 */}
									<p className="text-sm text-sub-text whitespace-pre-line leading-relaxed mb-3">
										{reply.content}
									</p>

									{/* 답글 반응 */}
									{reply.reactions && (
										<div className="flex items-center gap-4">
											<button className="flex items-center gap-1.5 text-xs text-sub-text hover:text-red-500 transition-colors">
												<Heart size={14} />
												<span>{reply.reactions.hearts}</span>
											</button>
											<button className="flex items-center gap-1.5 text-xs text-sub-text hover:text-blue-500 transition-colors">
												<ThumbsUp size={14} />
												<span>{reply.reactions.likes}</span>
											</button>
											<button className="flex items-center gap-1.5 text-xs text-sub-text hover:text-green-500 transition-colors">
												<MessageCircle size={14} />
												<span>{reply.reactions.comments}</span>
											</button>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* 답글이 없는 경우 */}
			{memo.replies.length === 0 && (
				<div className="rounded-card border border-card bg-card-bg p-6 text-center text-sub-text">
					아직 답글이 없습니다.
				</div>
			)}
		</div>
	);
}
