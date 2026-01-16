"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";

export type EditableSeriesPost = {
	id: string;
	title: string;
	subtitle?: string;
	thumbnail?: string;
	createdAt: string;
	included: boolean;
};

export type SeriesDraft = {
	name: string;
	thumbnail: string;
	posts: EditableSeriesPost[];
};

interface SeriesEditDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	draft: SeriesDraft;
	setDraft: React.Dispatch<React.SetStateAction<SeriesDraft>>;
	onSave: () => void;
	onCancel: () => void;
}

export default function SeriesEditDialog({
	open,
	onOpenChange,
	draft,
	setDraft,
	onSave,
	onCancel,
}: SeriesEditDialogProps) {
	const [previewError, setPreviewError] = useState(false);
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [uploadThumbnail, setUploadThumbnail] = useState("");
	const includedCount = draft.posts.filter((post) => post.included).length;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<ImageUploadDialog
				isOpen={isUploadOpen}
				onOpenChange={setIsUploadOpen}
				thumbnail={uploadThumbnail}
				setThumbnail={setUploadThumbnail}
				onUpload={(url) => {
					setDraft((prev) => ({ ...prev, thumbnail: url }));
					setPreviewError(false);
				}}
			/>
			<DialogContent
				onOpenAutoFocus={(event) => event.preventDefault()}
				className="bg-card border-card rounded-card backdrop-blur-card p-0 max-w-2xl"
			>
				<DialogHeader className="gap-0">
					<DialogTitle className="border-b border-card-border px-5 py-4 text-main-text flex items-center justify-between">
						<p>시리즈 수정</p>
					</DialogTitle>
					<DialogDescription className="px-5 py-5 text-main-text">
						<div className="space-y-5">
							<p className="text-xs text-sub-text">
								시리즈 이름, 썸네일, 포함 게시글을 편집할 수 있어요.
							</p>
								<div className="space-y-4">
									<div className="space-y-2">
										<label className="text-xs text-sub-text">시리즈 이름</label>
										<Input
											value={draft.name}
											onChange={(event) =>
												setDraft((prev) => ({
													...prev,
													name: event.target.value,
												}))
											}
											placeholder="시리즈 이름을 입력하세요"
											className="border-card bg-card"
										/>
									</div>
									<div className="space-y-2">
										<label className="text-xs text-sub-text">썸네일</label>
										{draft.thumbnail ? (
											<div className="relative h-32 w-full overflow-hidden rounded-card border border-card bg-card">
												<button
													type="button"
													className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center"
													style={{
														transition:
															"background-color 200ms, opacity 200ms",
													}}
													onClick={() => {
														setDraft((prev) => ({
															...prev,
															thumbnail: "",
														}));
														setPreviewError(false);
													}}
												>
													<X size={12} />
												</button>
												{!previewError ? (
													<Image
														src={draft.thumbnail}
														alt="시리즈 썸네일 미리보기"
														fill
														className="object-cover"
														onError={() => setPreviewError(true)}
													/>
												) : (
													<div className="absolute inset-0 w-full h-full flex items-center justify-center text-xs text-sub-text">
														미리보기 실패
													</div>
												)}
											</div>
										) : (
											<button
												type="button"
												className="h-32 w-full rounded-card border border-dashed border-card flex flex-col items-center justify-center text-xs text-sub-text hover:border-card-active"
												style={{ transition: "border-color 200ms" }}
												onClick={() => {
													setUploadThumbnail("");
													setIsUploadOpen(true);
												}}
											>
												<ImagePlus size={20} className="mb-2" />
												썸네일 업로드
											</button>
										)}
									</div>
								</div>
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-xs text-sub-text">
										시리즈 소속 게시글
									</span>
									<span className="text-xs text-sub-text">
										{includedCount}개 포함
									</span>
								</div>
								<div className="max-h-64 overflow-y-auto rounded-card border border-card bg-card">
									{draft.posts.map((post) => (
										<div
											key={post.id}
										className={cn(
											"flex items-center gap-3 px-3 py-2 border-b border-card-border last:border-b-0",
											post.included ? "opacity-100" : "opacity-50"
										)}
										>
											<input
												type="checkbox"
												checked={post.included}
												onChange={() =>
													setDraft((prev) => ({
														...prev,
														posts: prev.posts.map((item) =>
															item.id === post.id
																? { ...item, included: !item.included }
																: item
														),
													}))
												}
											/>
											<div className="min-w-0">
												<p className="text-sm text-main-text truncate">
													{post.title}
												</p>
												{post.subtitle && (
													<p className="text-xs text-sub-text truncate">
														{post.subtitle}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
								<div className="flex justify-end gap-2">
									<Button type="button" variant="outline" onClick={onCancel}>
										취소
									</Button>
									<Button
										type="button"
										onClick={onSave}
										className="bg-theme-primary hover:bg-theme-primary/90"
									>
										저장
									</Button>
								</div>
							</div>
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}
