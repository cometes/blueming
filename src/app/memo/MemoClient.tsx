"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dummyMemos } from "./dummyData";
import { Input } from "@/components/ui/input";
import MemoCreateModal from "@/components/modal/MemoCreateModal";

export default function MemoClient() {
	const memos = dummyMemos;
	const router = useRouter();
	const [searchInput, setSearchInput] = useState("");
	const [appliedQuery, setAppliedQuery] = useState("");
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const normalizedQuery = appliedQuery.trim().toLowerCase();
	const filteredMemos = useMemo(() => {
		if (!normalizedQuery) return memos;
		return memos.filter((memo) => {
			const tags = Array.isArray(memo.tags) ? memo.tags.join(" ") : "";
			const haystack = [memo.title, memo.content, memo.author, tags]
				.join(" ")
				.toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	}, [memos, normalizedQuery]);

	const handleViewThread = (id: string) => {
		router.push(`/memo/${id}`);
	};
	const handleCompose = () => {
		setIsCreateOpen(true);
	};
	const handleOpenSettings = () => {
		// TODO: 메모 설정 다이얼로그 연결 예정
	};

	return (
		<div className="shrink-0 w-full max-w-2xl mt-[90px] mb-[40px] mx-auto">
			<header className="mb-10 flex items-center justify-center">
				<div className="flex items-center gap-2 w-full sm:w-auto">
					<div className="w-[150px]"></div>
					<div className="w-full sm:w-[200px]">
						<Input
							className="border-card bg-card backdrop-blur-card rounded-card text-main-text"
							endIcon={searchInput ? X : Search}
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder="본문, 태그로 검색"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									setAppliedQuery(searchInput.trim());
								}
							}}
							onEndIconClick={
								searchInput
									? () => {
											setSearchInput("");
											setAppliedQuery("");
										}
									: undefined
							}
							endIconAriaLabel="검색어 지우기"
						/>
					</div>
					<Button
						type="button"
						onClick={handleOpenSettings}
						className="bg-card border-card text-main-text rounded-full w-10 h-10 hover:border-transparent"
						aria-label="메모 설정"
					>
						<Settings />
					</Button>
					<Button
						type="button"
						onClick={handleCompose}
						className="gap-2 bg-theme-primary text-white hover:bg-theme-primary/90"
					>
						<Plus size={16} />새 글쓰기
					</Button>
				</div>
			</header>

			<section className="columns-1 sm:columns-2 lg:columns-3 gap-2.5 [column-fill:_balance]">
				{filteredMemos.map((memo) => {
					const hasReplies = memo.replies.length > 0;

					return (
						<article
							key={memo.id}
							className="rounded-card border-card bg-card backdrop-blur-card p-4 mb-2.5 break-inside-avoid flex flex-col gap-3 hover:shadow-md transition-shadow duration-200 cursor-pointer"
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
							<h2 className="text-base font-semibold text-main-text font-title">
								{memo.title}
							</h2>

							{/* 내용 */}
							<p className="text-xs text-sub-text whitespace-pre-line line-clamp-3">
								{memo.content}
							</p>

							{/* 작성자 및 날짜 */}
							<div className="flex items-center justify-between text-xs text-sub-text">
								<div>
									{/* <img src="" className="" /> 여기에 사용자 프로필 사진 */}
									<span>{memo.author}</span>
								</div>

								<span>{memo.createdAt}</span>
							</div>
						</article>
					);
				})}
			</section>
			<MemoCreateModal
				isOpen={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				tagsOptions={Array.from(
					new Set(
						memos.flatMap((memo) =>
							Array.isArray(memo.tags) ? memo.tags : [],
						),
					),
				)}
			/>
		</div>
	);
}
