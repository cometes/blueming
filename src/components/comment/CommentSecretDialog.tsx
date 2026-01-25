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
import { Input } from "@/components/ui/input";

interface CommentSecretDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	pin: string;
	onPinChange: (value: string) => void;
	isVerifying: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export default function CommentSecretDialog({
	open,
	onOpenChange,
	pin,
	onPinChange,
	isVerifying,
	onClose,
	onConfirm,
}: CommentSecretDialogProps) {
	const isValid = /^\d{4}$/.test(pin);

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (next) {
					onOpenChange(true);
				} else {
					onClose();
				}
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>비밀 댓글 보기</DialogTitle>
					<DialogDescription>
						비밀번호 4자리를 입력하면 내용을 확인할 수 있습니다.
					</DialogDescription>
				</DialogHeader>
				<Input
					type="password"
					placeholder="비밀번호 4자리"
					inputMode="numeric"
					value={pin}
					onChange={(e) => onPinChange(e.target.value)}
				/>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						취소
					</Button>
					<Button
						type="button"
						onClick={onConfirm}
						disabled={!isValid || isVerifying}
					>
						보기
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
