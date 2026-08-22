"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { setSettingsLibrary } from "@/features/settings/api/client";

const clampLibraryPostsPerRow = (value: number) =>
	Math.min(Math.max(Math.floor(value), 1), 5);

/**
 * 라이브러리 목록 페이지의 표시 설정(레이아웃/페이지당 개수/행당 개수/작성 권한)과
 * 설정 다이얼로그의 임시 상태·저장 로직.
 */
export function useLibraryPageSettings() {
	const { library, updateLibrary, refreshSettings } = useSettings();

	const defaultLibrarySettings = useMemo(
		() => ({
			layoutType: "listWithImage" as const,
			postsPerPage: 10,
			postsPerRow: 3,
			writePermission: "admin" as const,
		}),
		[],
	);

	const resolvedLibrarySettings = useMemo(
		() => ({
			...defaultLibrarySettings,
			...(library || {}),
		}),
		[defaultLibrarySettings, library],
	);

	const [layoutType, setLayoutType] = useState<"list" | "listWithImage">(
		resolvedLibrarySettings.layoutType,
	);
	const [postsPerPage, setPostsPerPage] = useState(
		resolvedLibrarySettings.postsPerPage,
	);
	const [postsPerRow, setPostsPerRow] = useState(
		clampLibraryPostsPerRow(resolvedLibrarySettings.postsPerRow),
	);
	const [writePermission, setWritePermission] = useState<
		"admin" | "manager" | "member"
	>(resolvedLibrarySettings.writePermission);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Dialog 임시 상태 (저장 전까지 사용)
	const [tempLayoutType, setTempLayoutType] = useState(layoutType);
	const [tempPostsPerPage, setTempPostsPerPage] = useState(postsPerPage);
	const [tempPostsPerRow, setTempPostsPerRow] = useState(postsPerRow);
	const [tempWritePermission, setTempWritePermission] =
		useState(writePermission);

	useEffect(() => {
		setLayoutType(resolvedLibrarySettings.layoutType);
		setPostsPerPage(resolvedLibrarySettings.postsPerPage);
		setPostsPerRow(clampLibraryPostsPerRow(resolvedLibrarySettings.postsPerRow));
		setWritePermission(resolvedLibrarySettings.writePermission);
	}, [resolvedLibrarySettings]);

	// Dialog가 열릴 때 현재 설정값으로 임시 상태 초기화
	useEffect(() => {
		if (isDialogOpen) {
			setTempLayoutType(layoutType);
			setTempPostsPerPage(postsPerPage);
			setTempPostsPerRow(postsPerRow);
			setTempWritePermission(writePermission);
		}
	}, [isDialogOpen, layoutType, postsPerPage, postsPerRow, writePermission]);

	const handleSaveSettings = async () => {
		try {
			const payload = {
				layoutType: tempLayoutType,
				postsPerPage: tempPostsPerPage,
				postsPerRow: clampLibraryPostsPerRow(tempPostsPerRow),
				writePermission: tempWritePermission,
			};
			const response = await setSettingsLibrary(payload);
			setLayoutType(response.library.layoutType);
			setPostsPerPage(response.library.postsPerPage);
			setPostsPerRow(clampLibraryPostsPerRow(response.library.postsPerRow));
			setWritePermission(response.library.writePermission);
			updateLibrary?.(response.library);
			await refreshSettings?.({ broadcast: true });
			setIsDialogOpen(false);
			toast.success("저장되었습니다.");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "저장에 실패했습니다.";
			toast.error(message);
		}
	};

	return {
		layoutType,
		postsPerPage,
		postsPerRow,
		writePermission,
		isDialogOpen,
		setIsDialogOpen,
		tempLayoutType,
		setTempLayoutType,
		tempPostsPerPage,
		setTempPostsPerPage,
		tempPostsPerRow,
		setTempPostsPerRow,
		tempWritePermission,
		setTempWritePermission,
		handleSaveSettings,
	};
}
