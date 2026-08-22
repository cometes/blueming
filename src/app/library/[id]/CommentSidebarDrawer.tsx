"use client";

import { ChevronLeft } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import CommentSidebar from "./CommentSidebar";

interface CommentSidebarDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	postId?: string;
}

/** 상세 페이지 우측의 댓글 드로어 (책갈피 탭 + 슬라이드 패널) */
export default function CommentSidebarDrawer({
	isOpen,
	onOpenChange,
	postId,
}: CommentSidebarDrawerProps) {
	return (
		<div
			className={cn(
				"fixed inset-0 z-[60]",
				isOpen ? "pointer-events-auto" : "pointer-events-none",
			)}
		>
			<div
				className={cn(
					"absolute inset-0 transition-opacity duration-300",
					isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
				)}
				onClick={() => onOpenChange(false)}
				aria-hidden="true"
			/>
			<div
				className="absolute top-0 right-0 flex h-screen pointer-events-auto"
				style={{
					transform: isOpen ? "translateX(0)" : "translateX(340px)",
					transition: "transform 300ms ease-in-out",
				}}
				onClick={(event) => event.stopPropagation()}
			>
				{/* 책갈피 탭 */}
				<button
					type="button"
					onClick={() => onOpenChange(!isOpen)}
					className="w-8 h-20 mt-[120px] bg-card border border-r-0 border-card-border rounded-l-lg flex items-center justify-center cursor-pointer hover:bg-card-bg self-start"
					style={{ transition: "background-color 200ms" }}
					aria-label={isOpen ? "사이드바 닫기" : "사이드바 열기"}
				>
					<ChevronLeft
						size={16}
						className="text-sub-text"
						style={{
							transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
							transition: "transform 300ms ease-in-out",
						}}
					/>
				</button>
				{/* 드로어 본체 */}
				<div className="w-[340px] h-full bg-card border-l border-card-border shadow-lg flex flex-col backdrop-blur-card">
					{postId ? <CommentSidebar postId={postId} /> : null}
				</div>
			</div>
		</div>
	);
}
