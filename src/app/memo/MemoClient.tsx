"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Lock, Plus, Search, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MemoCreateModal from "@/components/modal/MemoCreateModal";
import { toast } from "sonner";
import {
	createMemo,
	fetchMemoList,
	type MemoItem,
	uploadMemoImages,
} from "@/queries/memo";
import type { CommentImage } from "@/hooks/comment/useCommentForm";
import { dateConvert } from "@/lib/date";
import AdminOnly from "@/components/common/AdminOnly";
import { useSettings } from "@/contexts/SettingsContext";
import { setSettingsMainMemo } from "@/queries/set/setSettingsMainMemo";
import PhotoboardSettingsDialog from "@/components/modal/PhotoboardSettingsDialog";

interface MemoClientProps {
	initialMemos?: MemoItem[];
}

export default function MemoClient({ initialMemos = [] }: MemoClientProps) {
	const router = useRouter();
	const { main, updateMain, refreshSettings } = useSettings();
	const [searchInput, setSearchInput] = useState("");
	const [appliedQuery, setAppliedQuery] = useState("");
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [memos, setMemos] = useState<MemoItem[]>(initialMemos);
	const [isLoading, setIsLoading] = useState(initialMemos.length === 0);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const hasLoadedRef = useRef(false);

	const defaultMemoSettings = useMemo(
		() => ({
			postsPerRow: 3,
			writePermission: "member" as const,
		}),
		[],
	);

	const resolvedMemoSettings = useMemo(
		() => ({
			...defaultMemoSettings,
			...(main?.memo || {}),
		}),
		[defaultMemoSettings, main],
	);

	const [postsPerRow, setPostsPerRow] = useState(
		resolvedMemoSettings.postsPerRow,
	);
	const [writePermission, setWritePermission] = useState<"admin" | "member">(
		resolvedMemoSettings.writePermission,
	);
	const [tempPostsPerRow, setTempPostsPerRow] = useState(postsPerRow);
	const [tempWritePermission, setTempWritePermission] =
		useState(writePermission);

	useEffect(() => {
		const { postsPerRow: newRows, writePermission: newPermission } =
			resolvedMemoSettings;
		setPostsPerRow((prev) => (newRows !== prev ? newRows : prev));
		setWritePermission((prev) =>
			newPermission !== prev ? newPermission : prev,
		);
	}, [resolvedMemoSettings]);

	useEffect(() => {
		if (isDialogOpen) {
			setTempPostsPerRow(postsPerRow);
			setTempWritePermission(writePermission);
		}
	}, [isDialogOpen, postsPerRow, writePermission]);

	const normalizedQuery = appliedQuery.trim().toLowerCase();
	const filteredMemos = useMemo(() => {
		if (!normalizedQuery) return memos;
		return memos.filter((memo) => {
			const tags = Array.isArray(memo.tags) ? memo.tags.join(" ") : "";
			const haystack = [
				memo.title,
				memo.content ?? "",
				memo.author?.name ?? "",
				tags,
			]
				.join(" ")
				.toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	}, [memos, normalizedQuery]);

	const handleViewThread = (id: string) => {
		router.push(`/memo/${id}`);
	};
	const handleCompose = () => setIsCreateOpen(true);

	const handleSaveSettings = async () => {
		try {
			const payload = {
				postsPerRow: tempPostsPerRow,
				writePermission: tempWritePermission,
			};
			await setSettingsMainMemo(payload);
			updateMain?.({ memo: payload });
			await refreshSettings?.({ broadcast: true });
			setPostsPerRow(payload.postsPerRow);
			setWritePermission(payload.writePermission);
			setIsDialogOpen(false);
			toast.success("저장되었습니다.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "저장에 실패했습니다.";
			toast.error(message);
		}
	};

	const loadMemos = useCallback(async (query: string) => {
		try {
			setIsLoading(true);
			const data = await fetchMemoList({ query });
			setMemos(Array.isArray(data.items) ? data.items : []);
		} catch (error) {
			console.error(error);
			toast.error("메모 목록을 불러오지 못했습니다.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!appliedQuery && initialMemos.length > 0 && !hasLoadedRef.current) {
			setMemos(initialMemos);
			setIsLoading(false);
			hasLoadedRef.current = true;
			return;
		}
		loadMemos(appliedQuery.trim());
	}, [appliedQuery, loadMemos, initialMemos]);

	const handleSubmitMemo = async (payload: {
		title: string;
		content: string;
		tags: string[];
		visibility: "public" | "secret" | "protected";
		password?: string;
		images: CommentImage[];
	}) => {
		const fileImages = payload.images.filter((img) => img.file);
		const uploadedUrls =
			fileImages.length > 0
				? await uploadMemoImages(
						fileImages.map((img) => img.file as File),
					)
				: [];
		let uploadIndex = 0;
		const finalImageUrls = payload.images.reduce<string[]>((acc, image) => {
			if (image.file) {
				const nextUrl = uploadedUrls[uploadIndex];
				uploadIndex += 1;
				if (nextUrl) acc.push(nextUrl);
			} else if (image.url && !image.url.startsWith("blob:")) {
				acc.push(image.url);
			}
			return acc;
		}, []);

		const created = await createMemo({
			title: payload.title,
			content: payload.content,
			tags: payload.tags,
			visibility: payload.visibility,
			password: payload.password,
			imageUrls: finalImageUrls,
		});

		setMemos((prev) => [created, ...prev]);
		toast.success("메모가 등록되었습니다.");
	};

	const clampedPostsPerRow = Math.min(Math.max(postsPerRow, 1), 6);
	const columnsClass =
		{
			1: "columns-1 sm:columns-1 lg:columns-1",
			2: "columns-1 sm:columns-2 lg:columns-2",
			3: "columns-1 sm:columns-2 lg:columns-3",
			4: "columns-1 sm:columns-2 lg:columns-4",
			5: "columns-1 sm:columns-2 lg:columns-5",
			6: "columns-1 sm:columns-2 lg:columns-6",
		}[clampedPostsPerRow] ?? "columns-1 sm:columns-2 lg:columns-3";

	return (
		<div className="shrink-0 w-full max-w-2xl mt-[90px] mb-[40px] mx-auto">
			<header className="mb-10 flex items-center justify-center">
				<div className="flex items-center gap-2 w-full sm:w-auto">
					<div className="w-[150px]"></div>
					<div className="w-full sm:w-[200px]">
						<Input
							className="border-card bg-card backdrop-blur-card rounded-card text-main-text"
							endIcon={searchInput ? X : Search}
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder="본문, 태그로 검색"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									setAppliedQuery(searchInput.trim());
								}
							}}
							onEndIconClick={
								searchInput
									? () => {
											setSearchInput("");
											setAppliedQuery("");
										}
									: undefined
							}
							endIconAriaLabel="검색어 지우기"
						/>
					</div>
					<AdminOnly>
						<PhotoboardSettingsDialog
							isOpen={isDialogOpen}
							onOpenChange={setIsDialogOpen}
							tempPostsPerRow={tempPostsPerRow}
							setTempPostsPerRow={setTempPostsPerRow}
							tempWritePermission={tempWritePermission}
							setTempWritePermission={setTempWritePermission}
							onSave={handleSaveSettings}
							trigger={
								<Button className="bg-card border-card text-main-text rounded-full w-10 h-10 hover:border-transparent">
									<Settings />
								</Button>
							}
						/>
					</AdminOnly>
					{writePermission === "admin" ? (
						<AdminOnly>
							<Button
								type="button"
								onClick={handleCompose}
								className="gap-2 bg-theme-primary text-white hover:bg-theme-primary/90"
							>
								<Plus size={16} />새 글쓰기
							</Button>
						</AdminOnly>
					) : (
						<Button
							type="button"
							onClick={handleCompose}
							className="gap-2 bg-theme-primary text-white hover:bg-theme-primary/90"
						>
							<Plus size={16} />새 글쓰기
						</Button>
					)}
				</div>
			</header>

			<section className={`${columnsClass} gap-2.5 [column-fill:_balance]`}>
				{isLoading && memos.length === 0 ? (
					<div className="text-sm text-sub-text">로딩 중...</div>
				) : (
					filteredMemos.map((memo) => (
						<article
							key={memo.id}
							className="rounded-card border-card bg-card backdrop-blur-card p-4 mb-2.5 break-inside-avoid flex flex-col gap-3 hover:shadow-md transition-shadow duration-200 cursor-pointer"
							onClick={() => handleViewThread(memo.id)}
						>
							{/* 태그 배지 */}
							{memo.tags && memo.tags.length > 0 && (
								<div className="flex flex-wrap gap-1.5">
									{memo.tags.map((tag, idx) => (
										<span
											key={idx}
											className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20"
										>
											{tag}
										</span>
									))}
								</div>
							)}

							{/* 제목 */}
							<h2 className="text-base font-semibold text-main-text font-title">
								{memo.title}
							</h2>

							{/* 내용 */}
							{memo.content ? (
								<p className="text-xs text-sub-text whitespace-pre-line line-clamp-3">
									{memo.content}
								</p>
							) : (
								<div className="text-xs text-sub-text flex items-center gap-1.5">
									<Lock size={12} />
									비공개 메모입니다.
								</div>
							)}

							{/* 작성자 및 날짜 */}
							<div className="flex items-center justify-between text-xs text-sub-text">
								<div className="flex items-center gap-2">
									<div className="w-5 h-5 rounded-full overflow-hidden border border-card">
										{memo.author?.avatarUrl ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={memo.author.avatarUrl}
												alt={memo.author?.name ?? "작성자"}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center text-[10px] font-medium">
												{memo.author?.name?.charAt(0) ?? "?"}
											</div>
										)}
									</div>
									<span>{memo.author?.name ?? "게스트"}</span>
								</div>

								<span>
									{memo.createdAt ? dateConvert(memo.createdAt) : ""}
								</span>
							</div>
						</article>
					))
				)}
			</section>
			<MemoCreateModal
				isOpen={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				tagsOptions={Array.from(
					new Set(
						memos.flatMap((memo) =>
							Array.isArray(memo.tags) ? memo.tags : [],
						),
					),
				)}
				onSubmit={handleSubmitMemo}
			/>
		</div>
	);
}
