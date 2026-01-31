"use client";

import * as React from "react";
import { useMoveToPage } from "@/hooks/useMoveToPage";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { extensions } from "@/components/editor/TiptapEditor";
import TiptapToolbar from "@/components/tiptap/TiptapToolbar";
import { MobileToolbarContainer } from "@/components/tiptap/MobileToolbarContainer";
import CreateModal, { CreateMetaValue } from "@/components/modal/createModal";
import { createLibraryPost } from "@/queries/set/createLibrary";
import { updateLibraryPost } from "@/queries/set/updateLibrary";
import { apiClient, getApiErrorMessage } from "@/queries/apiClient";
import { getAuthHeader } from "@/queries/getAuthHeader";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/auth/UseAdmin";
import { useAuthStore } from "@/store/auth/store";

interface SeriesItem {
	id: string;
	name: string;
}

interface TagItem {
	id: string;
	name: string;
}

interface LibraryNewClientProps {
	seriesData: SeriesItem[];
	tagsData: TagItem[];
	initialData?: {
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
	};
	mode?: "create" | "edit";
}

export default function LibararyNewClient({
	seriesData = [],
	tagsData = [],
	initialData,
	mode = "create",
}: LibraryNewClientProps) {
	const { onClickMoveToPage } = useMoveToPage();
	const router = useRouter();
	const { isAdmin } = useAdmin();
	const isAuthLoading = useAuthStore((state) => state.isLoading);
	const [subOpen, setSubOpen] = React.useState(false);
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
	const [metaValue, setMetaValue] = React.useState<CreateMetaValue>({
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
	});

	const initialContent = React.useMemo(() => {
		const raw = contentOverride ?? initialData?.content;
		if (!raw) return "";
		try {
			return JSON.parse(raw);
		} catch {
			return "";
		}
	}, [contentOverride, initialData?.content]);

	const editor = useEditor({
		extensions: extensions,
		content: initialContent,
		immediatelyRender: false,
		editorProps: {
			attributes: {
				class: "prose max-w-none focus:outline-none min-h-[400px] p-0",
			},
		},
	});

	React.useEffect(() => {
		if (!editor) return;
		if (!initialContent) return;
		editor.commands.setContent(initialContent);
	}, [editor, initialContent]);

	React.useEffect(() => {
		if (mode !== "edit" || isAuthLoading) return;
		if (!isAdmin) {
			toast.error("권한이 없습니다.");
			router.push("/library");
			router.refresh();
		}
	}, [mode, isAdmin, isAuthLoading, router]);

	React.useEffect(() => {
		if (!initialData) return;

		setTitle(initialData.title || "");
		setSubtitle(initialData.subtitle || "");
		setMetaValue({
			tags: initialData.tags ?? [],
			series: initialData.series ?? "",
			slug: initialData.slug ?? "",
			visibility: initialData.allow ?? "all",
			password:
				initialData.allow === "password" ? (initialData.password ?? "") : "",
			thumbnail: initialData.thumbnail ?? "",
			pinned: initialData.pinned ?? false,
			backgroundType: initialData.backgroundType ?? "default",
			backgroundColor: initialData.backgroundColor ?? "#fff",
			backgroundImage: initialData.backgroundImage ?? "",
			enableBackdrop:
				typeof initialData.enableBackdrop === "boolean"
					? initialData.enableBackdrop
					: true,
		});
	}, [initialData]);

	const needsPasswordForEdit =
		mode === "edit" &&
		initialData?.allow === "password" &&
		!initialData?.content &&
		!contentOverride;

	const applyDetailData = (data: LibraryNewClientProps["initialData"]) => {
		if (!data) return;
		setTitle(data.title || "");
		setSubtitle(data.subtitle || "");
		setMetaValue({
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
		if (data.content) {
			setContentOverride(data.content);
		}
	};

	const handleVerifyPassword = async () => {
		if (!initialData?.id || isVerifyingPassword) return;
		if (!passwordInput.trim()) {
			setPasswordError("비밀번호를 입력해주세요.");
			return;
		}

		setIsVerifyingPassword(true);
		setPasswordError("");
		try {
			const detailId = initialData?.slug || initialData?.id;
			const response = await apiClient.get(`/library/detail/${detailId}`, {
				headers: { "x-post-password": passwordInput.trim() },
			});
			applyDetailData(response.data);
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

	React.useEffect(() => {
		if (!needsPasswordForEdit || !initialData?.id) return;
		let isMounted = true;

		const fetchWithAuth = async () => {
			const headers = await getAuthHeader();
			if (!headers.Authorization) return;
			try {
				const detailId = initialData?.slug || initialData?.id;
				const response = await apiClient.get(`/library/detail/${detailId}`, {
					headers,
				});
				if (isMounted && response.data?.content) {
					applyDetailData(response.data);
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

	if (mode === "edit" && !isAuthLoading && !isAdmin) {
		return null;
	}

	const handleOpenMeta = () => {
		const plainText = editor?.getText().trim() ?? "";

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

	return (
		<EditorContext.Provider value={{ editor }}>
			<div className="w-full min-h-dvh">
				{/* Header */}
				<header className="Header w-full h-[60px] border-b border-card-bg backdrop-blur-card fixed top-0 left-0 z-50">
					<div
						className={cn(
							"HeaderContainer h-full flex justify-between items-center",
							"px-4 sm:px-6",
						)}
					>
						<Button variant="ghost" onClick={onClickMoveToPage("/library/")}>
							뒤로가기
						</Button>
						{/* Tiptap Toolbar - 데스크톱에서만 헤더에 표시 */}
						<div className="flex-1 mx-4 overflow-hidden hidden sm:flex">
							<TiptapToolbar editor={editor} />
						</div>
						<Button onClick={handleOpenMeta}>
							{mode === "edit" ? "수정하기" : "글쓰기"}
						</Button>
					</div>
				</header>
				{/* Mobile Toolbar - 모바일에서 키보드 상단 고정 */}
				<MobileToolbarContainer>
					<TiptapToolbar editor={editor} />
				</MobileToolbarContainer>
				{/* Body */}
				<div
					className={cn(
						"Container pt-[100px] md:pt-[120px] px-6 md:px-12 bg-card backdrop-blur-card max-w-2xl min-h-dvh border-card flex flex-col m-auto",
						"pb-[120px] sm:pb-[100px]",
					)}
				>
					<div className="TitleWrap relative">
						<input
							type="text"
							placeholder="제목을 입력해주세요."
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="text-2xl md:text-3xl border-none border-transparent text-main-text bg-background-none w-full placeholder:text-sub-text focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:outline-0 focus-visible:border-transparent p-0 font-title"
						/>
					</div>
					<div className="flex items-center mt-5">
						<span
							className={cn(
								"SubTitleIconBox flex items-center justify-center w-[18px] h-[18px] sm:w-6 sm:h-6 bg-gray-300 border border-gray-400 text-gray-400 rounded-[3px] cursor-pointer",
							)}
							style={{ transition: "all 300ms ease" }}
							onClick={() => {
								setSubOpen((prev) => !prev);
							}}
						>
							{subOpen ? <X size={16} /> : <Plus size={16} />}
						</span>
						<div
							className={cn(
								"SubTitleWrap relative overflow-hidden",
								subOpen ? "flex-1 min-w-0" : "flex-none",
							)}
							style={{
								maxWidth: subOpen ? "100%" : "0px",
								marginLeft: subOpen ? "12px" : "0px",
								opacity: subOpen ? 1 : 0,
								pointerEvents: subOpen ? "auto" : "none",
								transition:
									"max-width 300ms ease, margin-left 300ms ease, opacity 300ms ease",
							}}
						>
							<input
								type="text"
								placeholder="소제목을 입력해주세요."
								value={subtitle}
								onChange={(e) => setSubtitle(e.target.value)}
								onFocus={() => setSubOpen(true)}
								className="text-sm md:text-base border-0 text-sub-text w-full bg-background-none placeholder:text-sub-text focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:outline-0 pl-1"
								style={{ transition: "all 300ms ease" }}
							/>
						</div>
					</div>

					<hr className="mt-7 border-gray-600" />
					<div className="EditorBox pt-8 relative flex flex-col grow min-h-[400px]">
						{needsPasswordForEdit && (
							<div className="mb-6 p-4 rounded-card border-card bg-card-bg">
								<p className="text-main-text text-sm">
									보호글입니다. 비밀번호를 입력하면 내용을 불러옵니다.
								</p>
								<div className="mt-3 flex items-center gap-2">
									<Input
										type="password"
										value={passwordInput}
										onChange={(e) => setPasswordInput(e.target.value)}
										placeholder="비밀번호를 입력해주세요."
										className="flex-1"
									/>
									<Button
										type="button"
										onClick={handleVerifyPassword}
										disabled={isVerifyingPassword}
									>
										확인
									</Button>
								</div>
								{passwordError && (
									<p className="mt-2 text-xs text-red-500">{passwordError}</p>
								)}
							</div>
						)}
						{/* Editor Content */}
						<div className="flex-1">
							<EditorContent
								editor={editor}
								className="prose max-w-none focus:outline-none w-full h-full"
							/>
						</div>
					</div>
				</div>
			</div>
			<CreateModal
				open={metaOpen}
				onOpenChange={setMetaOpen}
				tagsOptions={tagsData}
				seriesOptions={seriesData}
				value={metaValue}
				onChange={setMetaValue}
				onConfirm={handleConfirmSubmit}
				isSubmitting={isSubmitting}
			/>
		</EditorContext.Provider>
	);
}
