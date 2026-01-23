"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Lock, User } from "lucide-react";

interface PhotoboardSettingsDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	tempPostsPerRow: number;
	setTempPostsPerRow: (count: number) => void;
	tempWritePermission: "admin" | "member";
	setTempWritePermission: (permission: "admin" | "member") => void;
	onSave: () => void;
	trigger: React.ReactNode;
}

export default function PhotoboardSettingsDialog({
	isOpen,
	onOpenChange,
	tempPostsPerRow,
	setTempPostsPerRow,
	tempWritePermission,
	setTempWritePermission,
	onSave,
	trigger,
}: PhotoboardSettingsDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent
				showCloseButton={false}
				className="bg-card border-card rounded-card backdrop-blur-card p-0"
			>
				<DialogHeader className="gap-0">
					<DialogTitle className="border-b border-card-border px-5 py-4 text-main-text flex items-center justify-between">
						<p>페이지 설정</p>
						<Button onClick={onSave}>저장하기</Button>
					</DialogTitle>
					<div className="px-5 py-4 text-main-text">
						<div className="flex flex-col gap-4">
							<div>
								<p>한 줄 당 게시글 수</p>
								<Input
									type="number"
									value={tempPostsPerRow}
									onChange={(e) =>
										setTempPostsPerRow(parseInt(e.target.value, 10) || 1)
									}
									min={1}
									max={6}
									className="w-20 mt-2 bg-card border-card rounded-card text-main-text"
								/>
							</div>
							<div>
								<p>게시글 작성 권한</p>
								<div className="flex gap-2 mt-2">
									<Button
										variant={
											tempWritePermission === "admin" ? "default" : "ghost"
										}
										onClick={() => setTempWritePermission("admin")}
									>
										<Lock /> 관리자
									</Button>
									<Button
										variant={
											tempWritePermission === "member" ? "default" : "ghost"
										}
										onClick={() => setTempWritePermission("member")}
									>
										<User /> 회원
									</Button>
								</div>
							</div>
						</div>
					</div>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}
