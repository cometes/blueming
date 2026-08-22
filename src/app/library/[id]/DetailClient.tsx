"use client";

import { useMoveToPage } from "@/hooks/useMoveToPage";
import { Separator } from "@/components/ui/separator";
import { useAdmin } from "@/features/admin/hooks/useAdmin";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth/store";
import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/shared/lib/utils";
import { parseLibraryContent } from "@/features/library/lib/parseLibraryContent";
import CommentSidebarDrawer from "./CommentSidebarDrawer";
import DetailToolbar from "./DetailToolbar";
import DetailTitleHeader from "./DetailTitleHeader";
import DetailPrevNextNav from "./DetailPrevNextNav";
import {
	DetailLoadingState,
	DetailPasswordGate,
	DetailSecretGate,
} from "./DetailAccessGates";
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

	const contentSource =
		isSecret && !canViewSecret ? null : localDetail?.content;
	const parsedContent = useMemo(
		() => parseLibraryContent(contentSource),
		[contentSource],
	);

	const renderBody = () => {
		if (
			(requiresPassword && !authChecked) ||
			(requiresSecretAccess && !secretAuthChecked)
		) {
			return <DetailLoadingState />;
		}
		if (requiresSecretAccess) {
			return <DetailSecretGate onBackToList={onClickMoveToPage(listPath)} />;
		}
		if (requiresPassword) {
			return (
				<DetailPasswordGate
					password={password}
					onPasswordChange={setPassword}
					passwordError={passwordError}
					onVerify={handleVerifyPassword}
					onBackToList={onClickMoveToPage(listPath)}
				/>
			);
		}
		return (
			<div>
				<DetailToolbar
					onBackToList={onClickMoveToPage(listPath)}
					isAdmin={isAdmin}
					isOwner={isOwner}
					isPinned={isPinned}
					onTogglePin={handleTogglePin}
					onEdit={onClickMoveToPage(`/library/${localDetail?.id}/edit`)}
					onDelete={handleDelete}
				/>
				<DetailTitleHeader detail={localDetail} />
				<Separator className="my-7 bg-gray-500" />
				<LibraryContentViewer content={parsedContent} />
			</div>
		);
	};

	return (
		<>
			{backgroundStyle ? (
				<div
					aria-hidden="true"
					className="fixed inset-0 -z-10"
					style={backgroundStyle}
				/>
			) : null}
			{canShowComments ? (
				<CommentSidebarDrawer
					isOpen={isSidebarOpen}
					onOpenChange={setIsSidebarOpen}
					postId={canShowComments ? localDetail?.id : undefined}
				/>
			) : null}
			<div className="Wrapper min-h-100vh w-full">
				<div
					className={cn(
						"Container relative w-full max-w-3xl min-h-dvh m-auto px-6 pt-10 pb-10 flex flex-col justify-between",
						enableBackdrop ? "bg-card backdrop-blur-card border-card" : "",
					)}
					style={{ borderTop: "none", borderBottom: "none" }}
				>
					{renderBody()}
					{!requiresPassword && (!isSecret || canViewSecret) && (
						<DetailPrevNextNav
							prevPost={localDetail?.prevPost}
							nextPost={localDetail?.nextPost}
							detailQuery={detailQuery}
							onNavigate={onClickMoveToPage}
						/>
					)}
				</div>
			</div>
		</>
	);
}
