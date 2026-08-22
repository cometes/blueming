"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LibraryDetailData } from "@/features/library/types";

type AdjacentPost = NonNullable<LibraryDetailData["prevPost"]>;

interface DetailPrevNextNavProps {
	prevPost?: AdjacentPost | null;
	nextPost?: AdjacentPost | null;
	detailQuery: string;
	onNavigate: (path: string) => () => void;
}

/** 상세 하단의 이전 글 / 다음 글 내비게이션 */
export default function DetailPrevNextNav({
	prevPost,
	nextPost,
	detailQuery,
	onNavigate,
}: DetailPrevNextNavProps) {
	return (
		<div className="PrevNextWrap flex justify-between mt-24">
			{prevPost ? (
				<div
					className="PrevNextBox prev flex-none flex items-center cursor-pointer rounded-card max-w-40 min-w-32 py-2 px-3.5 md:max-w-44 md:min-w-40 md:py-2.5 md:px-3.5 lg:max-w-52 lg:min-w-48 lg:py-3 lg:px-3.5 border-card bg-card backdrop-blur-card overflow-hidden group"
					onClick={onNavigate(
						`/library/${prevPost.slug || prevPost.id}${detailQuery}`,
					)}
				>
					<div
						className="PrevNextIconBox prevIcon w-6 h-6 md:w-9 md:h-9 lg:w-12 lg:h-12 flex-none flex items-center justify-center rounded-full bg-gray-300 group-hover:-translate-x-1"
						style={{ transition: "all 300ms ease-in-out" }}
					>
						<ChevronLeft size={16} className="text-gray-600 md:hidden" />
						<ChevronLeft
							size={18}
							className="text-gray-600 hidden md:block lg:hidden"
						/>
						<ChevronLeft size={20} className="text-gray-600 hidden lg:block" />
					</div>
					<div className="PrevNextTextBox overflow-hidden w-[calc(100% - 24px)] md:w-[calc(100% - 36px)] lg:w-[calc(100% - 48px)] pl-2 md:pl-3.5">
						<span className="PrevNextText text-xs text-sub-text">이전 글</span>
						<p
							className="PrevNextTitle text-lg font-semibold text-sub-text whitespace-nowrap overflow-hidden text-ellipsis w-full group-hover:text-gray-500 font-title"
							style={{ transition: "color 300ms" }}
						>
							{prevPost.title}
						</p>
					</div>
				</div>
			) : (
				<div className="flex-none" />
			)}
			{nextPost ? (
				<div
					className="PrevNextBox next flex-none flex items-center cursor-pointer rounded-card max-w-40 min-w-32 py-2 px-3.5 md:max-w-44 md:min-w-40 md:py-2.5 md:px-3.5 lg:max-w-52 lg:min-w-48 lg:py-3 lg:px-3.5 border-card bg-card backdrop-blur-card overflow-hidden flex-row-reverse group"
					onClick={onNavigate(
						`/library/${nextPost.slug || nextPost.id}${detailQuery}`,
					)}
				>
					<div
						className="PrevNextIconBox nextIcon w-6 h-6 md:w-9 md:h-9 lg:w-12 lg:h-12 flex-none flex items-center justify-center rounded-full bg-gray-300 group-hover:translate-x-1"
						style={{ transition: "all 300ms ease-in-out" }}
					>
						<ChevronRight size={16} className="text-gray-600 md:hidden" />
						<ChevronRight
							size={18}
							className="text-gray-600 hidden md:block lg:hidden"
						/>
						<ChevronRight size={20} className="text-gray-600 hidden lg:block" />
					</div>
					<div className="PrevNextTextBox overflow-hidden w-[calc(100% - 24px)] md:w-[calc(100% - 36px)] lg:w-[calc(100% - 48px)] pr-2 md:pr-3.5 flex flex-col items-end">
						<span className="PrevNextText text-xs text-sub-text">다음 글</span>
						<p
							className="PrevNextTitle text-lg font-semibold text-sub-text whitespace-nowrap overflow-hidden text-ellipsis w-full text-end group-hover:text-gray-500 font-title"
							style={{ transition: "color 300ms" }}
						>
							{nextPost.title}
						</p>
					</div>
				</div>
			) : (
				<div className="flex-none" />
			)}
		</div>
	);
}
