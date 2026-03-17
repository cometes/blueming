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
import { Lock, Rows3, Save, Shield, TableProperties, User } from "lucide-react";

interface LibrarySettingsDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	tempLayoutType: "list" | "listWithImage";
	setTempLayoutType: (type: "list" | "listWithImage") => void;
	tempPostsPerPage: number;
	setTempPostsPerPage: (count: number) => void;
	tempPostsPerRow: number;
	setTempPostsPerRow: (count: number) => void;
	tempWritePermission: "admin" | "manager" | "member";
	setTempWritePermission: (permission: "admin" | "manager" | "member") => void;
	onSave: () => void;
	trigger: React.ReactNode;
}

export default function LibrarySettingsDialog({
	isOpen,
	onOpenChange,
	tempLayoutType,
	setTempLayoutType,
	tempPostsPerPage,
	setTempPostsPerPage,
	tempPostsPerRow,
	setTempPostsPerRow,
	tempWritePermission,
	setTempWritePermission,
	onSave,
	trigger,
}: LibrarySettingsDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent
				showCloseButton={false}
				className="bg-card border-card rounded-card backdrop-blur-card p-0"
			>
				<DialogHeader className="gap-0">
					<DialogTitle className="border-b border-card-border px-5 py-4 text-main-text flex items-center justify-between">
						<p className="font-title">라이브러리 페이지 설정</p>
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
								<p className="font-title">페이지 레이아웃</p>
								<div className="flex gap-2 mt-2">
									<Button
										variant={tempLayoutType === "list" ? "default" : "ghost"}
										onClick={() => setTempLayoutType("list")}
									>
										<Rows3 /> 리스트형
									</Button>
									<Button
										variant={
											tempLayoutType === "listWithImage" ? "default" : "ghost"
										}
										onClick={() => setTempLayoutType("listWithImage")}
									>
										<TableProperties /> 리스트 이미지형
									</Button>
								</div>
							</div>
							<div>
								<p className="font-title">페이지 당 게시글 수</p>
								<Input
									type="number"
									value={tempPostsPerPage}
									onChange={(e) =>
										setTempPostsPerPage(parseInt(e.target.value) || 1)
									}
									min={1}
									max={100}
									className="w-20 mt-2 bg-card border-card rounded-card text-main-text"
								/>
							</div>
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
									<Button
										variant={
											tempWritePermission === "manager" ? "default" : "ghost"
										}
										onClick={() => setTempWritePermission("manager")}
									>
										<Shield /> 매니저
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
