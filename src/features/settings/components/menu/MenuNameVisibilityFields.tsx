"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Globe, Lock } from "lucide-react";

interface MenuNameVisibilityFieldsProps {
	name: string;
	onNameChange: (value: string) => void;
	isPublic: boolean;
	onPublicChange: (isPublic: boolean) => void;
}

/** 메뉴 추가/수정 모달 공통의 메뉴명 + 공개 여부 입력 행 */
export default function MenuNameVisibilityFields({
	name,
	onNameChange,
	isPublic,
	onPublicChange,
}: MenuNameVisibilityFieldsProps) {
	return (
		<div className="flex items-center gap-3">
			<div className="flex-1 space-y-1.5">
				<Label className="text-xs font-medium text-sub-text">메뉴명</Label>
				<Input
					value={name}
					onChange={(e) => onNameChange(e.target.value)}
					placeholder="메뉴명을 입력하세요"
					className="h-10 rounded-card border-card bg-card-bg focus:border-card-active transition-all"
				/>
			</div>
			<div className="w-[120px] space-y-1.5">
				<Label className="text-xs font-medium text-sub-text">공개 여부</Label>
				<Select
					value={isPublic ? "public" : "private"}
					onValueChange={(v) => onPublicChange(v === "public")}
				>
					<SelectTrigger className="h-10 rounded-card border-card bg-card-bg">
						<div className="flex items-center gap-2">
							{isPublic ? (
								<Globe size={14} className="text-theme-primary" />
							) : (
								<Lock size={14} className="text-sub-text" />
							)}
							<SelectValue />
						</div>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="public">전체 공개</SelectItem>
						<SelectItem value="private">비공개</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
