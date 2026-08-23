"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ImageSlideModal from "@/components/modal/ImageSlideModal";
import { useAuthStore } from "@/store/auth/store";
import { useAdmin } from "@/features/admin/hooks/useAdmin";
import { useSettings } from "@/contexts/SettingsContext";
import ThreadPostCard from "@/features/thread/components/ThreadPostCard";
import ThreadComposer from "@/features/thread/components/ThreadComposer";
import {
	deleteThreadPost,
	fetchThreadDetail,
} from "@/features/thread/api/client";
import type { ThreadPost } from "@/features/thread/types";

interface ThreadDetailClientProps {
	threadId: string;
	initialData: {
		requiresMemberAccess: boolean;
		root: ThreadPost | null;
		replies: ThreadPost[];
		focusId: string | null;
	} | null;
}

export default function ThreadDetailClient({
	threadId,
	initialData,
}: ThreadDetailClientProps) {
	const router = useRouter();
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const user = useAuthStore((state) => state.user);
	const { isAdmin, isManagerOrAdmin } = useAdmin();
	const { main } = useSettings();

	// 클라 표시용 작성 가능 여부 (서버가 최종 검증)
	const writePermission = main?.threads?.writePermission ?? "member";
	const canWrite =
		writePermission === "admin"
			? isAdmin
			: writePermission === "manager"
				? isManagerOrAdmin
				: isAuthenticated;

	const [requiresMemberAccess, setRequiresMemberAccess] = useState(
		initialData?.requiresMemberAccess ?? false,
	);
	const [root, setRoot] = useState<ThreadPost | null>(initialData?.root ?? null);
	const [replies, setReplies] = useState<ThreadPost[]>(
		initialData?.replies ?? [],
	);
	const [notFound, setNotFound] = useState(initialData === null);
	const [imageModal, setImageModal] = useState<{
		urls: string[];
		index: number;
	} | null>(null);

	const reload = useCallback(async () => {
		try {
			const data = await fetchThreadDetail(threadId);
			setRequiresMemberAccess(data.requiresMemberAccess);
			setRoot(data.root);
			setReplies(data.replies);
			setNotFound(false);
		} catch {
			setNotFound(true);
		}
	}, [threadId]);

	// 로그인 상태 변화 시(멤버 게이트 해제 등) 재조회
	useEffect(() => {
		if (requiresMemberAccess && isAuthenticated) {
			void reload();
		}
	}, [requiresMemberAccess, isAuthenticated, reload]);

	// 답글 id로 진입한 경우 해당 답글로 스크롤
	useEffect(() => {
		const focusId = initialData?.focusId;
		if (!focusId) return;
		const timer = setTimeout(() => {
			document
				.getElementById(`thread-post-${focusId}`)
				?.scrollIntoView({ behavior: "smooth", block: "center" });
		}, 300);
		return () => clearTimeout(timer);
	}, [initialData?.focusId]);

	const handleReplyPosted = useCallback((post: ThreadPost) => {
		setReplies((prev) => [...prev, post]);
		setRoot((prev) =>
			prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev,
		);
	}, []);

	const handleDelete = useCallback(
		async (post: ThreadPost) => {
			const isRoot = !post.rootId;
			const confirmed = window.confirm(
				isRoot
					? "스레드를 삭제할까요? 모든 답글이 함께 삭제됩니다."
					: "답글을 삭제할까요?",
			);
			if (!confirmed) return;
			try {
				await deleteThreadPost(post.id);
				toast.success("삭제되었습니다.");
				if (isRoot) {
					router.push("/thread");
				} else {
					setReplies((prev) => prev.filter((item) => item.id !== post.id));
					setRoot((prev) =>
						prev
							? { ...prev, replyCount: Math.max(0, prev.replyCount - 1) }
							: prev,
					);
				}
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "삭제에 실패했습니다.",
				);
			}
		},
		[router],
	);

	const canManage = useCallback(
		(post: ThreadPost) =>
			Boolean(user?.uid && (post.authorId === user.uid || isAdmin)),
		[user?.uid, isAdmin],
	);

	const renderPost = (
		post: ThreadPost,
		options: {
			isFocused?: boolean;
			connectTop?: boolean;
			connectBottom?: boolean;
			noBorder?: boolean;
			hideReplyLabel?: boolean;
		} = {},
	) => (
		<div key={post.id} id={`thread-post-${post.id}`} className="relative">
			<ThreadPostCard
				post={post}
				isFocused={options.isFocused}
				connectTop={options.connectTop}
				connectBottom={options.connectBottom}
				noBorder={options.noBorder}
				hideReplyLabel={options.hideReplyLabel}
				onOpenImage={(urls, index) => setImageModal({ urls, index })}
				onSelectTag={() => router.push("/thread")}
			/>
			{canManage(post) && (
				<div className="absolute right-3 top-3">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="rounded-full p-1 text-sub-text hover:bg-theme-primary/10 hover:text-theme-primary"
								aria-label="글 관리"
								onClick={(e) => e.stopPropagation()}
							>
								<MoreHorizontal size={16} />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="rounded-card border-card bg-card-bg backdrop-blur-card"
						>
							<DropdownMenuItem
								className="text-red-400"
								onSelect={() => void handleDelete(post)}
							>
								삭제하기
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}
		</div>
	);

	return (
		<div className="w-full max-w-xl mx-auto mt-[90px] mb-[40px]">
			<section className="bg-card rounded-card border-card backdrop-blur-card overflow-hidden">
				{/* 트위터식 상단 헤더 — 뒤로가기 + 타이틀 */}
				<header className="flex items-center gap-4 border-b border-card-border px-4 py-2.5">
					<button
						type="button"
						onClick={() => router.push("/thread")}
						className="flex h-8 w-8 items-center justify-center rounded-full text-main-text hover:bg-card-bg/60"
						aria-label="스레드 목록으로"
					>
						<ArrowLeft size={17} />
					</button>
					<h1 className="text-[16px] font-semibold font-title text-main-text">
						스레드
					</h1>
				</header>

				{notFound ? (
					<div className="py-16 text-center text-sm text-sub-text">
						삭제되었거나 존재하지 않는 글입니다.
					</div>
				) : requiresMemberAccess ? (
					<div className="flex flex-col items-center gap-2 py-16 text-sm text-sub-text">
						<Lock size={20} />
						멤버 공개 스레드입니다. 로그인 후 볼 수 있어요.
					</div>
				) : root ? (
					<>
						{renderPost(root, { isFocused: true })}
						{canWrite && (
							<ThreadComposer
								parentId={root.id}
								parentVisibility={root.visibility}
								placeholder="답글을 남겨보세요..."
								onPosted={handleReplyPosted}
							/>
						)}
						{replies.map((reply, index) =>
							renderPost(reply, {
								connectTop: index > 0,
								connectBottom: index < replies.length - 1,
								noBorder: true,
								hideReplyLabel: true,
							}),
						)}
					</>
				) : null}
			</section>

			{imageModal && (
				<ImageSlideModal
					isOpen
					onOpenChange={(open) => {
						if (!open) setImageModal(null);
					}}
					images={imageModal.urls}
					initialIndex={imageModal.index}
				/>
			)}
		</div>
	);
}
