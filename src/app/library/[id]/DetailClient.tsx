"use client";

import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateTimeConvert } from "@/shared/lib/date";
import {
	ChevronLeft,
	ChevronRight,
	Pin,
	Pencil,
	Trash2,
	Lock,
	Eye,
	EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAdmin } from "@/features/admin/hooks/useAdmin";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth/store";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/tiptap-ui-primitive/tooltip/tooltip";
import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { renderRichText } from "@/shared/lib/richText";
import CommentSidebar from "./CommentSidebar";
import {
	useLibraryDetailController,
	type LibraryDetailData,
} from "@/features/library/hooks/useLibraryDetailController";

const LibraryContentViewer = dynamic(() => import("./LibraryContentViewer"), {
	ssr: false,
	loading: () => (
		<div className="animate-pulse space-y-3 py-2">
			<div className="h-4 bg-card-bg rounded w-3/4" />
			<div className="h-4 bg-card-bg rounded" />
			<div className="h-4 bg-card-bg rounded w-5/6" />
			<div className="h-4 bg-card-bg rounded w-2/3" />
		</div>
	),
});

export default function DetailClient({
	detailData,
}: {
	detailData: LibraryDetailData | null | undefined;
}) {
	const { onClickMoveToPage } = useMoveToPage();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { isAdmin } = useAdmin();
	const isAuthLoading = useAuthStore((state) => state.isLoading);
	const user = useAuthStore((state) => state.user);
	const listPage = searchParams.get("page");
	const listPath = listPage ? `/library?page=${listPage}` : "/library";
	const detailQuery = listPage ? `?page=${listPage}` : "";
	const {
		localDetail,
		isPinned,
		isOwner,
		password,
		setPassword,
		passwordError,
		authChecked,
		secretAuthChecked,
		isSidebarOpen,
		setIsSidebarOpen,
		isSecret,
		canViewSecret,
		requiresPassword,
		requiresSecretAccess,
		canShowComments,
		enableBackdrop,
		backgroundStyle,
		handleDelete,
		handleTogglePin,
		handleVerifyPassword,
	} = useLibraryDetailController({
		detailData,
		isAdmin,
		isAuthLoading,
		userUid: user?.uid,
		onDeleted: () => {
			router.push(listPath);
			router.refresh();
		},
	});
	const [showPassword, setShowPassword] = useState(false);
	const authorName =
		typeof localDetail?.author === "string" && localDetail.author.trim()
			? localDetail.author
			: "익명";
	const authorPhotoURL =
		typeof localDetail?.authorPhotoURL === "string"
			? localDetail.authorPhotoURL
			: "";
	const authorInitial = authorName.trim().charAt(0) || "익";
	const contentSource =
		isSecret && !canViewSecret ? null : localDetail?.content;
	const parsedContent = useMemo(() => {
		if (!contentSource) return null;

		const isTiptapDoc = (value: unknown) => {
			if (!value || typeof value !== "object") return false;
			const doc = value as { type?: unknown; content?: unknown };
			return doc.type === "doc" && Array.isArray(doc.content);
		};

		const escapeHtml = (value: string) =>
			value
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#39;");

		const toParagraphHtml = (value: string) => `<p>${escapeHtml(value)}</p>`;

		const rawContent = contentSource;
		if (typeof rawContent === "string") {
			const trimmed = rawContent.trim();
			if (!trimmed) return "";

			try {
				const parsed = JSON.parse(trimmed);
				if (isTiptapDoc(parsed)) return parsed;

				const fallbackHtml = renderRichText(parsed);
				if (fallbackHtml) return fallbackHtml;
			} catch {
				if (trimmed.startsWith("<")) return trimmed;
				return toParagraphHtml(trimmed);
			}

			return trimmed.startsWith("<") ? trimmed : toParagraphHtml(trimmed);
		}

		if (isTiptapDoc(rawContent)) return rawContent;

		const fallbackHtml = renderRichText(rawContent);
		return fallbackHtml || null;
	}, [contentSource]);

	const sidebarDrawer = (
		<div
			className={cn(
				"fixed inset-0 z-[60]",
				isSidebarOpen ? "pointer-events-auto" : "pointer-events-none",
			)}
		>
			<div
				className={cn(
					"absolute inset-0 transition-opacity duration-300",
					isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
				)}
				onClick={() => setIsSidebarOpen(false)}
				aria-hidden="true"
			/>
			<div
				className="absolute top-0 right-0 flex h-screen pointer-events-auto"
				style={{
					transform: isSidebarOpen ? "translateX(0)" : "translateX(340px)",
					transition: "transform 300ms ease-in-out",
				}}
				onClick={(event) => event.stopPropagation()}
			>
				{/* 책갈피 탭 */}
				<button
					type="button"
					onClick={() => setIsSidebarOpen(!isSidebarOpen)}
					className="w-8 h-20 mt-[120px] bg-card border border-r-0 border-card-border rounded-l-lg flex items-center justify-center cursor-pointer hover:bg-card-bg self-start"
					style={{ transition: "background-color 200ms" }}
					aria-label={isSidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
				>
					<ChevronLeft
						size={16}
						className="text-sub-text"
						style={{
							transform: isSidebarOpen ? "rotate(180deg)" : "rotate(0deg)",
							transition: "transform 300ms ease-in-out",
						}}
					/>
				</button>
				{/* 드로어 본체 */}
				<div className="w-[340px] h-full bg-card border-l border-card-border shadow-lg flex flex-col backdrop-blur-card">
					{canShowComments && localDetail?.id ? (
						<CommentSidebar postId={localDetail.id} />
					) : null}
				</div>
			</div>
		</div>
	);

	return (
		<>
			{backgroundStyle ? (
				<div
					aria-hidden="true"
					className="fixed inset-0 -z-10"
					style={backgroundStyle}
				/>
			) : null}
			{canShowComments ? sidebarDrawer : null}
			<div className="Wrapper min-h-100vh w-full">
				<div
					className={cn(
						"Container relative w-full max-w-2xl min-h-dvh m-auto px-6 pt-10 pb-10 flex flex-col justify-between",
						enableBackdrop ? "bg-card backdrop-blur-card border-card" : "",
					)}
					style={{ borderTop: "none", borderBottom: "none" }}
				>
					{requiresPassword && !authChecked ? (
						<div className="flex flex-col items-center justify-center min-h-[60vh]">
							<div
								className="w-10 h-10 rounded-full border-2 border-card-border border-t-theme-primary animate-spin"
								aria-label="로딩 중"
							/>
						</div>
					) : requiresSecretAccess && !secretAuthChecked ? (
						<div className="flex flex-col items-center justify-center min-h-[60vh]">
							<div
								className="w-10 h-10 rounded-full border-2 border-card-border border-t-theme-primary animate-spin"
								aria-label="로딩 중"
							/>
						</div>
					) : requiresSecretAccess ? (
						<div className="flex flex-col items-center justify-center min-h-[60vh]">
							<div className="flex flex-col items-center gap-6 w-full max-w-md">
								<div className="w-20 h-20 rounded-full bg-card-bg border-2 border-card flex items-center justify-center">
									<Lock size={30} className="text-sub-text" />
								</div>
								<div className="text-center">
									<h2 className="text-2xl font-semibold text-main-text mb-2">
										비공개 게시글입니다.
									</h2>
									<p className="text-sub-text">
										작성자와 관리자만 열람할 수 있습니다.
									</p>
								</div>
								<Button
									variant="default"
									onClick={onClickMoveToPage(listPath)}
									className="mt-10"
								>
									목록으로
								</Button>
							</div>
						</div>
					) : requiresPassword ? (
						<div className="flex flex-col items-center justify-center min-h-[60vh]">
							<div className="flex flex-col items-center gap-6 w-full max-w-md">
								<div className="w-20 h-20 rounded-full bg-card-bg border-2 border-card flex items-center justify-center">
									<Lock size={30} className="text-sub-text" />
								</div>
								<div className="text-center">
									<h2 className="text-2xl font-semibold text-main-text mb-2">
										보호된 게시글입니다.
									</h2>
									<p className="text-sub-text">
										게시글 열람을 위해서 비밀번호를 입력해 주세요.
									</p>
								</div>
								<div className="w-full flex flex-col gap-3">
									<div className="flex items-center gap-2 justify-center">
										<div className="relative">
											<input
												type="text"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter" && !e.nativeEvent.isComposing) {
														handleVerifyPassword();
													}
												}}
												placeholder="비밀번호를 입력해주세요."
												style={showPassword ? undefined : ({ WebkitTextSecurity: "disc" } as React.CSSProperties)}
												className="w-46 pr-9 rounded-card border-card bg-card-bg px-3 py-2 text-sm text-main-text focus:outline-none focus:ring-0 focus:border-theme-primary"
											/>
											<button
												type="button"
												onClick={() => setShowPassword((prev) => !prev)}
												className="absolute right-2 top-1/2 -translate-y-1/2 text-sub-text hover:text-main-text"
												tabIndex={-1}
											>
												{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
											</button>
										</div>
										<Button
											variant="default"
											onClick={handleVerifyPassword}
										>
											확인
										</Button>
									</div>
									{passwordError && (
										<p className="text-sm text-red-500 text-center">
											{passwordError}
										</p>
									)}
								</div>
								<Button
									variant="default"
									onClick={onClickMoveToPage(listPath)}
									className="mt-10"
								>
									목록으로
								</Button>
							</div>
						</div>
					) : (
						<div>
							<div className="flex items-center justify-between mt-10">
								<Button onClick={onClickMoveToPage(listPath)}>목록으로</Button>
								{isAdmin || isOwner ? (
									<div className="flex items-center gap-3">
										{isAdmin && (
											<Tooltip>
												<TooltipTrigger asChild>
													<button
														type="button"
														onClick={handleTogglePin}
														className={cn(
															"w-8 h-8 rounded-full bg-card flex items-center justify-center border border-card cursor-pointer",
															isPinned ? "text-theme-primary" : "text-sub-text",
														)}
														style={{ transition: "color 200ms ease-out" }}
														aria-label="공지로 설정"
													>
														<Pin size={16} />
													</button>
												</TooltipTrigger>
												<TooltipContent className="text-xs">
													{isPinned ? "공지 해제" : "공지로 설정"}
												</TooltipContent>
											</Tooltip>
										)}
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													onClick={onClickMoveToPage(
														`/library/${localDetail?.id}/edit`,
													)}
													className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-card text-sub-text cursor-pointer"
													style={{ transition: "color 200ms ease-out" }}
													aria-label="수정"
												>
													<Pencil size={16} />
												</button>
											</TooltipTrigger>
											<TooltipContent className="text-xs">수정</TooltipContent>
										</Tooltip>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													onClick={handleDelete}
													className="w-8 h-8 rounded-full bg-card  flex items-center justify-center border border-card text-sub-text cursor-pointer"
													style={{ transition: "color 200ms ease-out" }}
													aria-label="삭제"
												>
													<Trash2 size={16} />
												</button>
											</TooltipTrigger>
											<TooltipContent className="text-xs">삭제</TooltipContent>
										</Tooltip>
									</div>
								) : (
									<div />
								)}
							</div>
							<div className="TitleWrap mt-15">
								<h1 className="Title text-2xl text-main-text font-bold tracking-normal font-title">
									{localDetail?.title}
								</h1>
								<h2 className="Subtitle text-sm text-sub-text mt-1 font-medium">
									{localDetail?.subtitle}
								</h2>
								<div className="mt-4 flex items-center gap-2 text-sm text-sub-text">
									{authorPhotoURL ? (
										<div className="relative w-8 h-8 rounded-full overflow-hidden">
											<Image
												src={authorPhotoURL}
												alt={authorName}
												fill
												className="object-cover"
											/>
										</div>
									) : (
										<div className="w-8 h-8 rounded-full bg-card-bg border border-card flex items-center justify-center text-xs font-medium text-main-text">
											{authorInitial}
										</div>
									)}
									<span className="font-medium text-main-text">
										{authorName}
									</span>
									<span className="text-border">•</span>
									<span>{dateTimeConvert(localDetail?.createdAt ?? "")}</span>
								</div>
								{(localDetail?.tags?.length ?? 0) > 0 && (
									<div className="TagBox flex mt-4">
										{/* 태그 */}
										{(localDetail?.tags?.length ?? 0) > 0 && (
											<div className="flex flex-wrap gap-2">
												{localDetail?.tags?.map((tag, index) => (
													<Badge
														key={index}
														variant="secondary"
														className={cn(
															"px-3 text-xs font-medium rounded-full",
															"bg-white/60 text-theme-primary border-theme-primary/80",
														)}
														style={{
															transition:
																"background-color 200ms, color 200ms, border-color 200ms",
														}}
													>
														{tag}
													</Badge>
												))}
											</div>
										)}
									</div>
								)}
							</div>
							<Separator className="my-7 bg-gray-500" />
							<LibraryContentViewer content={parsedContent} />
						</div>
					)}
					{!requiresPassword && (!isSecret || canViewSecret) && (
						<div className="PrevNextWrap flex justify-between mt-24">
							{localDetail?.prevPost ? (
								<div
									className="PrevNextBox prev flex-none flex items-center cursor-pointer rounded-card max-w-40 min-w-32 py-2 px-3.5 md:max-w-44 md:min-w-40 md:py-2.5 md:px-3.5 lg:max-w-52 lg:min-w-48 lg:py-3 lg:px-3.5 border-card bg-card backdrop-blur-card overflow-hidden group"
									onClick={onClickMoveToPage(
										`/library/${localDetail?.prevPost?.slug || localDetail?.prevPost?.id}${detailQuery}`,
									)}
								>
									<div
										className="PrevNextIconBox prevIcon w-6 h-6 md:w-9 md:h-9 lg:w-12 lg:h-12 flex-none flex items-center justify-center rounded-full bg-gray-300 group-hover:-translate-x-1"
										style={{ transition: "all 300ms ease-in-out" }}
									>
										<ChevronLeft
											size={16}
											className="text-gray-600 md:hidden"
										/>
										<ChevronLeft
											size={18}
											className="text-gray-600 hidden md:block lg:hidden"
										/>
										<ChevronLeft
											size={20}
											className="text-gray-600 hidden lg:block"
										/>
									</div>
									<div className="PrevNextTextBox overflow-hidden w-[calc(100% - 24px)] md:w-[calc(100% - 36px)] lg:w-[calc(100% - 48px)] pl-2 md:pl-3.5">
										<span className="PrevNextText text-xs text-sub-text">
											이전 글
										</span>
										<p
											className="PrevNextTitle text-lg font-semibold text-sub-text whitespace-nowrap overflow-hidden text-ellipsis w-full group-hover:text-gray-500 font-title"
											style={{ transition: "color 300ms" }}
										>
											{localDetail?.prevPost?.title}
										</p>
									</div>
								</div>
							) : (
								<div className="flex-none" />
							)}
							{localDetail?.nextPost ? (
								<div
									className="PrevNextBox next flex-none flex items-center cursor-pointer rounded-card max-w-40 min-w-32 py-2 px-3.5 md:max-w-44 md:min-w-40 md:py-2.5 md:px-3.5 lg:max-w-52 lg:min-w-48 lg:py-3 lg:px-3.5 border-card bg-card backdrop-blur-card overflow-hidden flex-row-reverse group"
									onClick={onClickMoveToPage(
										`/library/${localDetail?.nextPost?.slug || localDetail?.nextPost?.id}${detailQuery}`,
									)}
								>
									<div
										className="PrevNextIconBox nextIcon w-6 h-6 md:w-9 md:h-9 lg:w-12 lg:h-12 flex-none flex items-center justify-center rounded-full bg-gray-300 group-hover:translate-x-1"
										style={{ transition: "all 300ms ease-in-out" }}
									>
										<ChevronRight
											size={16}
											className="text-gray-600 md:hidden"
										/>
										<ChevronRight
											size={18}
											className="text-gray-600 hidden md:block lg:hidden"
										/>
										<ChevronRight
											size={20}
											className="text-gray-600 hidden lg:block"
										/>
									</div>
									<div className="PrevNextTextBox overflow-hidden w-[calc(100% - 24px)] md:w-[calc(100% - 36px)] lg:w-[calc(100% - 48px)] pr-2 md:pr-3.5 flex flex-col items-end">
										<span className="PrevNextText text-xs text-sub-text">
											다음 글
										</span>
										<p
											className="PrevNextTitle text-lg font-semibold text-sub-text whitespace-nowrap overflow-hidden text-ellipsis w-full text-end group-hover:text-gray-500 font-title"
											style={{ transition: "color 300ms" }}
										>
											{localDetail?.nextPost?.title}
										</p>
									</div>
								</div>
							) : (
								<div className="flex-none" />
							)}
						</div>
					)}
				</div>
			</div>
		</>
	);
}
