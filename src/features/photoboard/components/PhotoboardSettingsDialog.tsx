"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Lock, Save, Shield, User } from "lucide-react";

interface PhotoboardSettingsDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	tempPostsPerRow: number;
	setTempPostsPerRow: (count: number) => void;
	tempWritePermission: "admin" | "manager" | "member";
	setTempWritePermission: (permission: "admin" | "manager" | "member") => void;
	showManagerOption?: boolean;
	title?: string;
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
	showManagerOption = false,
	title = "포토보드 페이지 설정",
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
						<p className="font-title">{title}</p>
						<Button
							onClick={onSave}
							variant="ghost"
							size="icon"
							aria-label="저장하기"
							title="저장하기"
							className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
							style={{ transition: "all 0.3s ease-in-out" }}
						>
							<Save size={16} />
						</Button>
					</DialogTitle>
					<div className="px-5 py-4 text-main-text">
						<div className="flex flex-col gap-4">
							<div>
								<p className="font-title">카드뷰 칼럼 수</p>
								<div className="flex gap-1 mt-2">
									{[2, 3, 4, 5].map((col) => (
										<Button
											key={col}
											variant={tempPostsPerRow === col ? "default" : "ghost"}
											onClick={() => setTempPostsPerRow(col)}
											className="flex-1 px-3"
										>
											{col}
										</Button>
									))}
								</div>
								<p className="text-xs text-sub-text mt-1.5">
									모바일/태블릿은 자동으로 조정됩니다
								</p>
							</div>
							<div>
								<p className="font-title">게시글 작성 권한</p>
								<div className="flex gap-2 mt-2">
									<Button
										variant={
											tempWritePermission === "admin" ? "default" : "ghost"
										}
										onClick={() => setTempWritePermission("admin")}
									>
										<Lock /> 관리자
									</Button>
									{showManagerOption ? (
										<Button
											variant={
												tempWritePermission === "manager" ? "default" : "ghost"
											}
											onClick={() => setTempWritePermission("manager")}
										>
											<Shield /> 매니저
										</Button>
									) : null}
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
