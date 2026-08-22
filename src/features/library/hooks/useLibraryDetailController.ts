"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	deleteLibraryPost,
	fetchLibraryDetailWithAccess,
	recordLibraryView,
	setLibraryPin,
} from "@/features/library/api/client";
import { getApiErrorMessage } from "@/shared/lib/http/client";
import type { LibraryDetailData } from "@/features/library/types";

// 타입 정의는 features/library/types.ts로 이동. 기존 import 경로 호환을 위해 재노출.
export type { LibraryDetailData };

interface UseLibraryDetailControllerArgs {
	detailData: LibraryDetailData | null | undefined;
	isAdmin: boolean;
	isAuthLoading: boolean;
	userUid?: string | null;
	onDeleted: () => void;
}

export function useLibraryDetailController({
	detailData,
	isAdmin,
	isAuthLoading,
	userUid,
	onDeleted,
}: UseLibraryDetailControllerArgs) {
	const [localDetail, setLocalDetail] = useState(detailData);
	const [isPinned, setIsPinned] = useState(Boolean(detailData?.pinned));
	const [password, setPassword] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);
	const [authChecked, setAuthChecked] = useState(true);
	const [secretAuthChecked, setSecretAuthChecked] = useState(false);
	const [secretAccessGranted, setSecretAccessGranted] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const ownerId =
		localDetail?.authorId ??
		(typeof localDetail?.author === "object" ? localDetail.author?.id : null) ??
		localDetail?.uid ??
		null;
	const isOwner = Boolean(ownerId && userUid === ownerId);
	const isSecret = localDetail?.allow === "secret";
	const canViewSecret = Boolean(isAdmin || isOwner || secretAccessGranted);
	const requiresPassword =
		localDetail?.allow === "password" &&
		(localDetail?.requiresPassword ?? !localDetail?.content);
	const detailId = localDetail?.id;
	const requiresSecretAccess = isSecret && !canViewSecret;
	const canShowComments =
		(!requiresPassword || Boolean(localDetail?.content)) &&
		(!requiresSecretAccess || canViewSecret);

	const backgroundType =
		typeof localDetail?.backgroundType === "string"
			? localDetail.backgroundType
			: "default";
	const backgroundColor =
		typeof localDetail?.backgroundColor === "string"
			? localDetail.backgroundColor
			: "";
	const backgroundImage =
		typeof localDetail?.backgroundImage === "string"
			? localDetail.backgroundImage
			: "";
	const enableBackdrop =
		typeof localDetail?.enableBackdrop === "boolean"
			? localDetail.enableBackdrop
			: true;
	const backgroundStyle = useMemo(() => {
		if (backgroundType === "color" && backgroundColor) {
			return { backgroundColor };
		}
		if (backgroundType === "image" && backgroundImage) {
			return {
				backgroundImage: `url(${backgroundImage})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
				backgroundAttachment: "fixed",
			};
		}
		return null;
	}, [backgroundColor, backgroundImage, backgroundType]);

	useEffect(() => {
		setIsPinned(Boolean(detailData?.pinned));
	}, [detailData?.pinned]);

	useEffect(() => {
		setLocalDetail(detailData);
	}, [detailData]);

	const handleDelete = useCallback(async () => {
		if (!localDetail?.id) return;
		const confirmed = window.confirm("이 게시글을 삭제할까요?");
		if (!confirmed) return;

		try {
			await deleteLibraryPost(localDetail.id);
			toast.success("삭제되었습니다.");
			onDeleted();
		} catch {
			toast.error("삭제에 실패했습니다.");
		}
	}, [localDetail?.id, onDeleted]);

	const handleTogglePin = useCallback(async () => {
		if (!localDetail?.id) return;
		const nextPinned = !isPinned;
		setIsPinned(nextPinned);
		try {
			await setLibraryPin(localDetail.id, nextPinned);
			toast.success(
				nextPinned ? "공지로 설정되었습니다." : "공지 설정이 해제되었습니다.",
			);
		} catch {
			setIsPinned(!nextPinned);
			toast.error("공지 설정 변경에 실패했습니다.");
		}
	}, [isPinned, localDetail?.id]);

	const handleVerifyPassword = useCallback(async () => {
		if (!detailId || isVerifying) return;
		if (!password.trim()) {
			setPasswordError("비밀번호를 입력해주세요.");
			return;
		}

		setIsVerifying(true);
		setPasswordError("");
		try {
			const data = await fetchLibraryDetailWithAccess(detailId, {
				password,
			});
			setLocalDetail(data);
			setPassword("");
			setPasswordError("");
			setAuthChecked(true);
		} catch (error) {
			setPasswordError(
				getApiErrorMessage(error, "비밀번호가 올바르지 않습니다."),
			);
		} finally {
			setIsVerifying(false);
		}
	}, [detailId, isVerifying, password]);

	useEffect(() => {
		if (!requiresPassword) {
			setAuthChecked(true);
		}
	}, [detailId, requiresPassword]);

	useEffect(() => {
		if (!requiresPassword || !detailId) return;
		if (isAuthLoading) return;
		let isMounted = true;

		const fetchWithAuth = async () => {
			try {
				const data = await fetchLibraryDetailWithAccess(detailId, {
					includeAuth: true,
				});
				if (isMounted && data) {
					setLocalDetail(data);
				}
			} catch {
				// ignore
			} finally {
				if (isMounted) setAuthChecked(true);
			}
		};

		void fetchWithAuth();
		return () => {
			isMounted = false;
		};
	}, [detailId, isAuthLoading, requiresPassword]);

	useEffect(() => {
		if (!isSecret) {
			setSecretAccessGranted(false);
			setSecretAuthChecked(true);
			return;
		}
		if (isAuthLoading) return;
		if (isAdmin || isOwner) {
			setSecretAccessGranted(true);
		} else {
			setSecretAccessGranted(false);
		}
		setSecretAuthChecked(true);
	}, [isSecret, isAuthLoading, isAdmin, isOwner]);

	const viewFiredRef = useRef<Set<string>>(new Set());
	useEffect(() => {
		if (!detailId) return;
		if (isAuthLoading) return;
		if (!localDetail?.content) return;
		if (isSecret && !canViewSecret) return;
		if (viewFiredRef.current.has(detailId)) return;

		viewFiredRef.current.add(detailId);
		recordLibraryView(detailId)
			.then((result) => {
				if (typeof result.viewCount === "number" && result.viewCount > 0) {
					setLocalDetail((prev) =>
						prev ? { ...prev, viewCount: result.viewCount } : prev,
					);
				}
			})
			.catch(() => {
				// silent fail — 조회수 오류가 페이지에 영향을 주면 안 됨
			});
	}, [detailId, isAuthLoading, localDetail?.content, isSecret, canViewSecret]);

	useEffect(() => {
		if (!isSecret || !detailId) {
			setSecretAuthChecked(true);
			setSecretAccessGranted(false);
			return;
		}
		if (isAdmin || isOwner) {
			setSecretAuthChecked(true);
			return;
		}
		if (isAuthLoading) return;
		let isMounted = true;

		const fetchWithAuth = async () => {
			try {
				const data = await fetchLibraryDetailWithAccess(detailId, {
					includeAuth: true,
				});
				if (isMounted && data?.content) {
					setLocalDetail(data);
					setSecretAccessGranted(true);
				}
			} catch {
				// ignore
			} finally {
				if (isMounted) setSecretAuthChecked(true);
			}
		};

		void fetchWithAuth();
		return () => {
			isMounted = false;
		};
	}, [detailId, isAdmin, isAuthLoading, isOwner, isSecret]);

	return {
		localDetail,
		isPinned,
		password,
		setPassword,
		passwordError,
		isVerifying,
		authChecked,
		secretAuthChecked,
		secretAccessGranted,
		isSidebarOpen,
		setIsSidebarOpen,
		isOwner,
		isSecret,
		canViewSecret,
		requiresPassword,
		requiresSecretAccess,
		canShowComments,
		backgroundType,
		backgroundColor,
		backgroundImage,
		enableBackdrop,
		backgroundStyle,
		handleDelete,
		handleTogglePin,
		handleVerifyPassword,
	};
}
