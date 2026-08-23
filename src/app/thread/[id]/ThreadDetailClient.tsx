"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
	/** 답글 대상 (null = 현재 포커스 글에 답글) */
	const [replyTarget, setReplyTarget] = useState<ThreadPost | null>(null);

	// ── parentId 트리 구성 — 트위터식 포커스 중심 렌더링 ──────────────────────
	const byId = useMemo(() => {
		const map = new Map<string, ThreadPost>();
		if (root) map.set(root.id, root);
		for (const reply of replies) map.set(reply.id, reply);
		return map;
	}, [root, replies]);

	const childrenByParent = useMemo(() => {
		const map = new Map<string, ThreadPost[]>();
		if (!root) return map;
		for (const reply of replies) {
			// 부모가 삭제된 고아 답글은 루트 아래로 편입 (타임라인에서 사라지지 않게)
			const parentId =
				reply.parentId && byId.has(reply.parentId) ? reply.parentId : root.id;
			const list = map.get(parentId) ?? [];
			list.push(reply);
			map.set(parentId, list);
		}
		return map;
	}, [replies, byId, root]);

	/** 현재 포커스 글 — URL의 id (삭제됐으면 루트로 폴백) */
	const focused = byId.get(threadId) ?? root;

	/** 포커스 글 위에 보여줄 조상 체인 (루트 → … → 부모) */
	const ancestors = useMemo(() => {
		if (!focused) return [];
		const chain: ThreadPost[] = [];
		let cursor = focused.parentId ? byId.get(focused.parentId) : undefined;
		let guard = 0;
		while (cursor && guard < 100) {
			chain.unshift(cursor);
			cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
			guard += 1;
		}
		// 부모가 삭제된 고아 포커스면 루트만이라도 위에 보여준다
		if (chain.length === 0 && root && focused.id !== root.id) {
			chain.unshift(root);
		}
		return chain;
	}, [focused, byId, root]);

	/** 포커스 글의 직접 답글들 = 분리된 브랜치 그룹 */
	const branches = focused ? (childrenByParent.get(focused.id) ?? []) : [];

	const directCount = useCallback(
		(id: string) => childrenByParent.get(id)?.length ?? 0,
		[childrenByParent],
	);
	/** 상세에서는 답글 수를 직접 답글 수로 표시 (트위터식) */
	const withCount = useCallback(
		(post: ThreadPost): ThreadPost => ({
			...post,
			replyCount: directCount(post.id),
		}),
		[directCount],
	);

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
		setReplyTarget(null);
	}, []);

	// 답글 아이콘 클릭 → 그 글을 답글 대상으로 지정하고 컴포저로 스크롤
	const handleSelectReplyTarget = useCallback(
		(post: ThreadPost) => {
			setReplyTarget(post.id === focused?.id ? null : post);
			document
				.getElementById("thread-reply-composer")
				?.scrollIntoView({ behavior: "smooth", block: "center" });
		},
		[focused?.id],
	);

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
				onReply={canWrite ? handleSelectReplyTarget : undefined}
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
				) : root && focused ? (
					<>
						{/* 조상 체인 (루트 → … → 부모) — 연결선으로 포커스 글까지 이어짐 */}
						{ancestors.map((ancestor, index) =>
							renderPost(withCount(ancestor), {
								connectTop: index > 0,
								connectBottom: true,
								noBorder: true,
								hideReplyLabel: true,
							}),
						)}

						{renderPost(withCount(focused), {
							isFocused: true,
							connectTop: ancestors.length > 0,
						})}

						{canWrite && (
							<div id="thread-reply-composer">
								<ThreadComposer
									parentId={replyTarget?.id ?? focused.id}
									parentVisibility={root.visibility}
									replyToName={
										replyTarget
											? replyTarget.author?.name || "사용자"
											: null
									}
									onClearReplyTarget={() => setReplyTarget(null)}
									placeholder="답글을 남겨보세요..."
									onPosted={handleReplyPosted}
								/>
							</div>
						)}

						{/* 포커스 글의 직접 답글 = 분리된 브랜치 그룹, 하위 답글은 '답글 보기'로 진입 */}
						{branches.map((branch) => (
							<div key={branch.id} className="border-b border-card-border">
								{renderPost(withCount(branch), {
									noBorder: true,
									connectBottom: directCount(branch.id) > 0,
									hideReplyLabel: true,
								})}
								{directCount(branch.id) > 0 && (
									<button
										type="button"
										onClick={() => router.push(`/thread/${branch.id}`)}
										className="flex w-full items-center gap-3 px-4 py-1.5 text-left hover:bg-card-bg/40"
									>
										<span className="flex w-9 shrink-0 flex-col items-center gap-[3px]">
											<span className="h-1 w-0.5 rounded-full bg-card-border" />
											<span className="h-1 w-0.5 rounded-full bg-card-border" />
											<span className="h-1 w-0.5 rounded-full bg-card-border" />
										</span>
										<span className="text-[13px] text-theme-primary hover:underline">
											답글 보기
										</span>
									</button>
								)}
							</div>
						))}
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
