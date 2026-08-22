"use client";

import { Plus, Search, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LibraryToolbarProps {
	isCardOn: boolean;
	onSelectView: (isCardOn: boolean) => void;
	searchValue: string;
	onSearchValueChange: (value: string) => void;
	onSubmitSearch: () => void;
	onClearSearch: () => void;
	canWrite: boolean;
	onWrite: () => void;
	/** 관리자용 설정 다이얼로그 (트리거 포함). 없으면 렌더링하지 않음 */
	settingsSlot?: React.ReactNode;
}

/** 라이브러리 목록 상단 툴바: 뷰 토글 + 검색 + 설정 + 새 글쓰기 */
export default function LibraryToolbar({
	isCardOn,
	onSelectView,
	searchValue,
	onSearchValueChange,
	onSubmitSearch,
	onClearSearch,
	canWrite,
	onWrite,
	settingsSlot,
}: LibraryToolbarProps) {
	const hasRightButtons = Boolean(settingsSlot) || canWrite;

	return (
		<div className="flex justify-center items-center gap-2.5">
			<div className="flex items-center justify-end sm:w-[150px]">
				<div className="relative flex rounded-card bg-transparent p-1">
					<div
						className={cn(
							"absolute top-1 w-10 h-10 rounded-card bg-card border border-card transition-all duration-300 ease-in-out shadow-sm",
							isCardOn ? "translate-x-10" : "translate-x-0",
						)}
					/>
					<button
						className="relative z-10 w-10 h-10 rounded-card p-2.5 cursor-pointer flex flex-col justify-between transition-colors duration-300"
						onClick={() => onSelectView(false)}
					>
						<span className="w-full h-[3px] rounded-[1px] bg-[#dee2e6]" />
						<span className="w-full h-[3px] rounded-[1px] bg-[#dee2e6]" />
						<span className="w-full h-[3px] rounded-[1px] bg-[#dee2e6]" />
					</button>
					<button
						className="relative z-10 w-10 h-10 rounded-card p-2.5 cursor-pointer grid grid-cols-2 gap-0.5 transition-colors duration-300"
						onClick={() => onSelectView(true)}
					>
						<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
						<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
						<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
						<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
					</button>
				</div>
			</div>
			<div className="flex items-center w-fit h-full">
				<Input
					className="border-card bg-card backdrop-blur-card rounded-card text-main-text"
					endIcon={searchValue ? X : Search}
					value={searchValue}
					onChange={(e) => onSearchValueChange(e.target.value)}
					placeholder="제목, 태그로 검색"
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							onSubmitSearch();
						}
					}}
					onEndIconClick={searchValue ? onClearSearch : undefined}
					endIconAriaLabel="검색어 지우기"
				/>
			</div>
			{settingsSlot}
			{canWrite ? (
				<>
					<Button
						onClick={onWrite}
						className="bg-theme-primary hover:bg-theme-primary/90 hidden sm:flex"
					>
						<Plus size={14} />새 글쓰기
					</Button>
					<Button
						onClick={onWrite}
						className="w-10 h-10 bg-theme-primary hover:bg-theme-primary/90 block sm:hidden"
					>
						<Plus size={14} />
					</Button>
				</>
			) : null}
			{!hasRightButtons ? <div className="w-[90px] sm:w-[150px]" /> : null}
		</div>
	);
}
