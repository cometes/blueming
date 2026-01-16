"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { dummyMemos } from "./dummyData";

export default function MemoClient() {
	const memos = dummyMemos;
	const router = useRouter();

	const handleViewThread = (id: string) => {
		router.push(`/memo/${id}`);
	};

	return (
		<div className="w-full max-w-[1200px] mx-auto px-4 py-10">
			<header className="mb-8">
				<h1 className="text-[22px] font-semibold text-main-text">메모</h1>
				<p className="text-sm text-sub-text mt-2">
					간단한 메모를 타래로 확인할 수 있습니다.
				</p>
			</header>

			<section className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
				{memos.map((memo) => {
					const hasReplies = memo.replies.length > 0;

					return (
						<article
							key={memo.id}
							className="rounded-card border border-card bg-card-bg p-4 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200 cursor-pointer"
							onClick={() => handleViewThread(memo.id)}
						>
							{/* 태그 배지 */}
							{memo.tags && memo.tags.length > 0 && (
								<div className="flex flex-wrap gap-1.5">
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
							<h2 className="text-base font-semibold text-main-text">
								{memo.title}
							</h2>

							{/* 내용 */}
							<p className="text-sm text-sub-text whitespace-pre-line line-clamp-3">
								{memo.content}
							</p>

							{/* 작성자 및 날짜 */}
							<div className="flex items-center justify-between text-xs text-sub-text">
								<span>작성자 · {memo.author}</span>
								<span>{memo.createdAt}</span>
							</div>

							{/* 타래 보기 버튼 */}
							{hasReplies && (
								<div className="pt-2 border-t border-card">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="w-full justify-center text-theme-primary hover:text-theme-primary/80"
										onClick={(e) => {
											e.stopPropagation();
											handleViewThread(memo.id);
										}}
									>
										이 타래 보기 ({memo.replies.length})
									</Button>
								</div>
							)}
						</article>
					);
				})}
			</section>
		</div>
	);
}
