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

interface MenuResetDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function MenuResetDialog({
	open,
	onOpenChange,
	onConfirm,
}: MenuResetDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="rounded-card border-card bg-card-bg backdrop-blur-sm">
				<DialogHeader>
					<DialogTitle>메뉴 초기화</DialogTitle>
					<DialogDescription>
						정말 메뉴 설정을 초기화할까요? 모든 메뉴가 삭제됩니다.
					</DialogDescription>
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
					>
						초기화
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

