"use client";

import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface MenuPostingTabProps {
	category: string;
	boardArr: { label: string; value: string }[];
	onCategoryChange: (value: string) => void;
}

export default function MenuPostingTab({
	category,
	boardArr,
	onCategoryChange,
}: MenuPostingTabProps) {
	return (
		<div className="space-y-1.5">
			<Label className="text-xs font-medium text-sub-text">게시판 선택</Label>
			<Select value={category} onValueChange={onCategoryChange}>
				<SelectTrigger className="h-10 rounded-card border-card bg-card-bg">
					<SelectValue placeholder="게시판을 선택하세요" />
				</SelectTrigger>
				<SelectContent>
					{boardArr.map((board) => (
						<SelectItem key={board.value} value={board.value}>
							{board.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
