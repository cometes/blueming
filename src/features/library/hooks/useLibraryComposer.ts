"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Editor } from "@tiptap/react";
import type { CreateMetaValue } from "@/features/library/components/CreateModal";
import {
	createLibraryPost,
	fetchLibraryDetailWithAccess,
	updateLibraryPost,
} from "@/features/library/api/client";
import { getApiErrorMessage } from "@/shared/lib/http/client";

export interface LibraryComposerInitialData {
	id: string;
	title: string;
	subtitle?: string;
	content: string;
	slug?: string | null;
	tags?: string[];
	series?: string;
	backgroundType?: "default" | "color" | "image";
	backgroundColor?: string | null;
	backgroundImage?: string | null;
	enableBackdrop?: boolean;
	allow?: "all" | "password" | "secret";
	password?: string | null;
	thumbnail?: string;
	pinned?: boolean;
}

const EMPTY_META: CreateMetaValue = {
	tags: [],
	series: "",
	slug: "",
	visibility: "all",
	password: "",
	thumbnail: "",
	pinned: false,
	backgroundType: "default",
	backgroundColor: "#fff",
	backgroundImage: "",
	enableBackdrop: true,
};

const toMetaValue = (data: LibraryComposerInitialData): CreateMetaValue => ({
	tags: data.tags ?? [],
	series: data.series ?? "",
	slug: data.slug ?? "",
	visibility: data.allow ?? "all",
	password: data.allow === "password" ? (data.password ?? "") : "",
	thumbnail: data.thumbnail ?? "",
	pinned: data.pinned ?? false,
	backgroundType: data.backgroundType ?? "default",
	backgroundColor: data.backgroundColor ?? "#fff",
	backgroundImage: data.backgroundImage ?? "",
	enableBackdrop:
		typeof data.enableBackdrop === "boolean" ? data.enableBackdrop : true,
});

interface UseLibraryComposerArgs {
	/** 에디터는 initialContent로 뒤에 생성되므로 ref로 주입받는다 (호출 시점에만 사용) */
	editorRef: React.RefObject<Editor | null>;
	mode: "create" | "edit";
	initialData?: LibraryComposerInitialData;
}

/**
 * 라이브러리 글쓰기/수정 화면의 작성 상태와 제출 로직.
 * - initialData 동기화, 보호글(비밀번호) 내용 로딩, 출간/수정 제출을 담당한다.
 * - 에디터 인스턴스는 useLibraryEditor가 만들고 여기로 주입된다.
 */
export function useLibraryComposer({
	editorRef,
	mode,
	initialData,
}: UseLibraryComposerArgs) {
	const router = useRouter();
	const [title, setTitle] = React.useState("");
	const [subtitle, setSubtitle] = React.useState("");
	const [metaOpen, setMetaOpen] = React.useState(false);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [contentOverride, setContentOverride] = React.useState<string | null>(
		null,
	);
	const [passwordInput, setPasswordInput] = React.useState("");
	const [passwordError, setPasswordError] = React.useState("");
	const [isVerifyingPassword, setIsVerifyingPassword] = React.useState(false);
	const [metaValue, setMetaValue] = React.useState<CreateMetaValue>(EMPTY_META);

	const initialContent = React.useMemo(() => {
		const raw = contentOverride ?? initialData?.content;
		if (!raw) return "";
		try {
			return JSON.parse(raw);
		} catch {
			return "";
		}
	}, [contentOverride, initialData?.content]);

	React.useEffect(() => {
		if (!initialData) return;
		setTitle(initialData.title || "");
		setSubtitle(initialData.subtitle || "");
		setMetaValue(toMetaValue(initialData));
	}, [initialData]);

	const needsPasswordForEdit =
		mode === "edit" &&
		initialData?.allow === "password" &&
		!initialData?.content &&
		!contentOverride;

	const applyDetailData = React.useCallback(
		(data: LibraryComposerInitialData | undefined) => {
			if (!data) return;
			setTitle(data.title || "");
			setSubtitle(data.subtitle || "");
			setMetaValue(toMetaValue(data));
			if (data.content) {
				setContentOverride(data.content);
			}
		},
		[],
	);

	const handleVerifyPassword = async () => {
		if (!initialData?.id || isVerifyingPassword) return;
		if (!passwordInput.trim()) {
			setPasswordError("비밀번호를 입력해주세요.");
			return;
		}

		setIsVerifyingPassword(true);
		setPasswordError("");
		try {
			const data = await fetchLibraryDetailWithAccess(initialData.id, {
				password: passwordInput.trim(),
			});
			// 상세 API 응답은 편집 모드에서 initialData와 같은 형태로 내려온다
			applyDetailData(data as LibraryComposerInitialData);
			setPasswordInput("");
			setPasswordError("");
		} catch (error) {
			setPasswordError(
				getApiErrorMessage(error, "비밀번호가 올바르지 않습니다."),
			);
		} finally {
			setIsVerifyingPassword(false);
		}
	};

	// 작성자 본인이라면 비밀번호 없이 인증 헤더로 보호글 내용을 로드
	React.useEffect(() => {
		if (!needsPasswordForEdit || !initialData?.id) return;
		let isMounted = true;

		const fetchWithAuth = async () => {
			try {
				const data = await fetchLibraryDetailWithAccess(initialData.id, {
					includeAuth: true,
				});
				if (isMounted && data?.content) {
					applyDetailData(data as LibraryComposerInitialData);
				}
			} catch {
				// Ignore: user isn't author or no auth
			}
		};

		fetchWithAuth();

		return () => {
			isMounted = false;
		};
	}, [
		applyDetailData,
		initialData?.id,
		initialData?.slug,
		needsPasswordForEdit,
	]);

	const handleOpenMeta = () => {
		const plainText = editorRef.current?.getText().trim() ?? "";

		if (!title.trim()) {
			toast.error("제목을 입력해 주세요.");
			return;
		}

		if (!plainText) {
			toast.error("내용을 입력해 주세요.");
			return;
		}

		setMetaValue((prev) => ({ ...prev, title }));
		setMetaOpen(true);
	};

	const handleConfirmSubmit = async () => {
		const editor = editorRef.current;
		if (!editor) {
			toast.error("에디터를 불러오지 못했습니다.");
			return;
		}

		const contentJson = editor.getJSON();
		const contentText = editor.getText().trim();

		if (!title.trim() || !contentText) {
			toast.error("제목과 내용을 입력해주세요.");
			return;
		}

		setIsSubmitting(true);
		try {
			const payload = {
				title: title.trim(),
				subtitle: subtitle.trim() || undefined,
				content: JSON.stringify(contentJson),
				slug: metaValue.slug,
				tags: metaValue.tags,
				series: metaValue.series,
				backgroundType: metaValue.backgroundType,
				backgroundColor: metaValue.backgroundColor,
				backgroundImage: metaValue.backgroundImage,
				enableBackdrop: metaValue.enableBackdrop,
				visibility: metaValue.visibility,
				password: metaValue.password,
				thumbnail: metaValue.thumbnail,
				pinned: metaValue.pinned,
			};

			if (mode === "edit") {
				if (!initialData?.id) {
					toast.error("수정할 게시글을 찾지 못했습니다.");
					return;
				}
				const response = await updateLibraryPost(initialData.id, payload);
				toast.success("게시글이 수정되었습니다.");
				setMetaOpen(false);
				const detailId = response.slug ?? initialData.id;
				router.push(`/library/${detailId}`);
				router.refresh();
				return;
			}

			const response = await createLibraryPost(payload);
			toast.success("게시글이 저장되었습니다.");
			setMetaOpen(false);
			const detailId = response.slug ?? response.postId;
			router.push(`/library/${detailId}`);
			router.refresh();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "게시글 저장에 실패했습니다.";
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return {
		title,
		setTitle,
		subtitle,
		setSubtitle,
		metaOpen,
		setMetaOpen,
		metaValue,
		setMetaValue,
		isSubmitting,
		initialContent,
		needsPasswordForEdit,
		passwordInput,
		setPasswordInput,
		passwordError,
		isVerifyingPassword,
		handleVerifyPassword,
		handleOpenMeta,
		handleConfirmSubmit,
	};
}
