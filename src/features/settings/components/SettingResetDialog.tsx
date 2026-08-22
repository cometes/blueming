"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SettingResetDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	onConfirm: () => void;
}

/** 설정 화면 공통의 초기화 확인 다이얼로그 (일반/디자인/메뉴 설정에서 사용) */
export function SettingResetDialog({
	open,
	onOpenChange,
	title,
	description,
	onConfirm,
}: SettingResetDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="rounded-card border-card bg-card-bg backdrop-blur-sm">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="rounded-card border-card bg-card-bg"
					>
						취소
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={onConfirm}
						className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
						style={{ transition: "all 0.3s ease-in-out" }}
					>
						초기화
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
