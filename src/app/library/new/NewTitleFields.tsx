"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface NewTitleFieldsProps {
	title: string;
	onTitleChange: (value: string) => void;
	subtitle: string;
	onSubtitleChange: (value: string) => void;
}

/** 글쓰기 화면의 제목 + 접이식 소제목 입력 */
export default function NewTitleFields({
	title,
	onTitleChange,
	subtitle,
	onSubtitleChange,
}: NewTitleFieldsProps) {
	const [subOpen, setSubOpen] = React.useState(false);

	return (
		<>
			<div className="TitleWrap relative">
				<input
					type="text"
					placeholder="제목을 입력해주세요."
					value={title}
					onChange={(e) => onTitleChange(e.target.value)}
					className="text-2xl md:text-3xl border-none border-transparent text-main-text bg-background-none w-full placeholder:text-sub-text focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:outline-0 focus-visible:border-transparent p-0 font-title"
				/>
			</div>
			<div className="flex items-center mt-5">
				<span
					className={cn(
						"SubTitleIconBox flex items-center justify-center w-[18px] h-[18px] sm:w-6 sm:h-6 bg-gray-300 border border-gray-400 text-gray-400 rounded-[3px] cursor-pointer",
					)}
					style={{ transition: "all 300ms ease" }}
					onClick={() => {
						setSubOpen((prev) => !prev);
					}}
				>
					{subOpen ? <X size={16} /> : <Plus size={16} />}
				</span>
				<div
					className={cn(
						"SubTitleWrap relative overflow-hidden",
						subOpen ? "flex-1 min-w-0" : "flex-none",
					)}
					style={{
						maxWidth: subOpen ? "100%" : "0px",
						marginLeft: subOpen ? "12px" : "0px",
						opacity: subOpen ? 1 : 0,
						pointerEvents: subOpen ? "auto" : "none",
						transition:
							"max-width 300ms ease, margin-left 300ms ease, opacity 300ms ease",
					}}
				>
					<input
						type="text"
						placeholder="소제목을 입력해주세요."
						value={subtitle}
						onChange={(e) => onSubtitleChange(e.target.value)}
						onFocus={() => setSubOpen(true)}
						className="text-sm md:text-base border-0 text-sub-text w-full bg-background-none placeholder:text-sub-text focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:outline-0 pl-1"
						style={{ transition: "all 300ms ease" }}
					/>
				</div>
			</div>
		</>
	);
}
