"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Lock, Rows3, TableProperties, User } from "lucide-react";

interface LibrarySettingsDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	tempLayoutType: "list" | "listWithImage";
	setTempLayoutType: (type: "list" | "listWithImage") => void;
	tempPostsPerPage: number;
	setTempPostsPerPage: (count: number) => void;
	tempPostsPerRow: number;
	setTempPostsPerRow: (count: number) => void;
	tempWritePermission: "admin" | "member";
	setTempWritePermission: (permission: "admin" | "member") => void;
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
						<p> 페이지 설정</p>
						<Button onClick={onSave}>저장하기</Button>
					</DialogTitle>
					<DialogDescription className=" px-5 py-4 text-main-text">
						<div className="flex flex-col gap-4">
							<div>
								<p>페이지 레이아웃</p>
								<div className="flex gap-2 mt-2">
									<Button
										variant={tempLayoutType === "list" ? "default" : "outline"}
										onClick={() => setTempLayoutType("list")}
									>
										<Rows3 /> 리스트형
									</Button>
									<Button
										variant={
											tempLayoutType === "listWithImage" ? "default" : "outline"
										}
										onClick={() => setTempLayoutType("listWithImage")}
									>
										<TableProperties /> 리스트 이미지형
									</Button>
								</div>
							</div>
							<div>
								<p>페이지 당 게시글 수</p>
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
								<p>한 줄 당 게시글 수</p>
								<Input
									type="number"
									value={tempPostsPerRow}
									onChange={(e) =>
										setTempPostsPerRow(parseInt(e.target.value) || 1)
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
											tempWritePermission === "admin" ? "default" : "outline"
										}
										onClick={() => setTempWritePermission("admin")}
									>
										<Lock /> 관리자
									</Button>
									<Button
										variant={
											tempWritePermission === "member" ? "default" : "outline"
										}
										onClick={() => setTempWritePermission("member")}
									>
										<User /> 회원
									</Button>
								</div>
							</div>
						</div>
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}
