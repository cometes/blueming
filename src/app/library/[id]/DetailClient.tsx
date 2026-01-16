"use client";

import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateConvert } from "@/lib/date";
import { ChevronLeft, ChevronRight, Pin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAdmin } from "@/hooks/auth/UseAdmin";
import { deleteLibraryPost } from "@/queries/set/deleteLibrary";
import { setLibraryPin } from "@/queries/set/setLibraryPin";
import { apiClient, getApiErrorMessage } from "@/queries/apiClient";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/tiptap-ui-primitive/tooltip/tooltip";
import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { BulletList } from "@tiptap/extension-bullet-list";
import { OrderedList } from "@tiptap/extension-ordered-list";
import { ListItem } from "@tiptap/extension-list-item";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import { FontSize } from "@/components/tiptap-extension/font-size";
import { Highlight } from "@tiptap/extension-highlight";
import { Underline } from "@tiptap/extension-underline";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Link } from "@tiptap/extension-link";
import { CustomImage } from "@/components/tiptap-extension/custom-image";
import { CustomYoutubeNode } from "@/components/tiptap-node/youtube-node/youtube-node";
import { renderRichText } from "@/lib/richText";

import "@/styles/tiptap-variables.css";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/image-upload-node/image-upload-node.scss";
import "@/components/tiptap-node/youtube-node/youtube-node.scss";

export default function DetailClient({ detailData }) {
	const { onClickMoveToPage } = useMoveToPage();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { isAdmin } = useAdmin();
	const listPage = searchParams.get("page");
	const listPath = listPage ? `/library?page=${listPage}` : "/library";
	const detailQuery = listPage ? `?page=${listPage}` : "";
	const [localDetail, setLocalDetail] = useState(detailData);
	const [isPinned, setIsPinned] = useState(Boolean(detailData?.pinned));
	const [password, setPassword] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);
	const parsedContent = useMemo(() => {
		if (!localDetail?.content) return null;

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

		const toParagraphHtml = (value: string) =>
			`<p>${escapeHtml(value)}</p>`;

		const rawContent = localDetail.content;
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
	}, [localDetail?.content]);
	const viewerExtensions = useMemo(
		() => [
			StarterKit.configure({
				bulletList: false,
				orderedList: false,
				listItem: false,
				dropcursor: false,
			}),
			Link.configure({ openOnClick: false }),
			BulletList,
			OrderedList,
			ListItem,
			TextStyle,
			Color.configure({
				types: ["textStyle"],
			}),
			FontFamily.configure({
				types: ["textStyle"],
			}),
			FontSize.configure({
				types: ["textStyle"],
			}),
			Highlight.configure({ multicolor: true }),
			Underline,
			Superscript,
			Subscript,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			TaskList.configure({
				HTMLAttributes: {
					class: "task-list",
				},
			}),
			TaskItem.configure({
				nested: true,
				HTMLAttributes: {
					class: "task-item",
				},
			}),
			CustomYoutubeNode,
			CustomImage,
		],
		[]
	);
	const editor = useEditor({
		extensions: viewerExtensions,
		content: parsedContent ?? "",
		immediatelyRender: false,
		editable: false,
		editorProps: {
			attributes: {
				class: "tiptap prose max-w-none text-main-text readonly",
			},
		},
	});

	useEffect(() => {
		setIsPinned(Boolean(detailData?.pinned));
	}, [detailData?.pinned]);

	useEffect(() => {
		if (!editor || parsedContent == null) return;
		editor.commands.setContent(parsedContent);
	}, [editor, parsedContent]);

	useEffect(() => {
		setLocalDetail(detailData);
	}, [detailData]);

	const handleDelete = async () => {
		if (!localDetail?.id) return;
		const confirmed = window.confirm("이 게시글을 삭제할까요?");
		if (!confirmed) return;

		try {
			await deleteLibraryPost(localDetail.id);
			toast.success("삭제되었습니다.");
			router.push(listPath);
			router.refresh();
		} catch {
			toast.error("삭제에 실패했습니다.");
		}
	};

	const handleTogglePin = async () => {
		if (!localDetail?.id) return;
		const nextPinned = !isPinned;
		setIsPinned(nextPinned);
		try {
			await setLibraryPin(localDetail.id, nextPinned);
			toast.success(
				nextPinned ? "공지로 설정되었습니다." : "공지 설정이 해제되었습니다."
			);
		} catch {
			setIsPinned(!nextPinned);
			toast.error("공지 설정 변경에 실패했습니다.");
		}
	};

	const requiresPassword =
		localDetail?.allow === "password" && !localDetail?.content;
	const detailId = localDetail?.slug || localDetail?.id;

	const handleVerifyPassword = async () => {
		if (!detailId || isVerifying) return;
		if (!password.trim()) {
			setPasswordError("비밀번호를 입력해주세요.");
			return;
		}

		setIsVerifying(true);
		setPasswordError("");
		try {
			const response = await apiClient.get(`/library/detail/${detailId}`, {
				headers: { "x-post-password": password },
			});
			setLocalDetail(response.data);
			setPassword("");
			setPasswordError("");
		} catch (error) {
			setPasswordError(
				getApiErrorMessage(error, "비밀번호가 올바르지 않습니다.")
			);
		} finally {
			setIsVerifying(false);
		}
	};

	return (
		<div className="Wrapper min-h-100vh">
			<div
				className="Container w-3xl min-h-dvh m-auto bg-card backdrop-blur-card border-card px-6 pt-10 pb-10 flex flex-col justify-between"
				style={{ borderTop: "none", borderBottom: "none" }}
			>
				<div>
					<div>
						<Button onClick={onClickMoveToPage(listPath)}>목록으로</Button>
					</div>
					<div className="TitleWrap mt-15">
						<h1 className="Title text-3xl text-main-text font-bold tracking-normal">
							{localDetail?.title}
						</h1>
						<h2 className="Subtitle text-lg text-sub-text mt-2 font-medium">
							{localDetail?.subtitle}
						</h2>
						<div className="EditWrap flex items-center mt-10">
							{localDetail?.tags?.length > 0 && (
								<div className="TagBox flex">
									{/* 태그 */}
									{localDetail.tags?.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-1.5">
											{localDetail.tags.map((tag, index) => (
												<Badge
													key={index}
													variant="secondary"
													className={cn(
														"px-3 text-xs font-medium rounded-full",
														"bg-theme-primary/10 text-theme-primary border-theme-primary/20",
														"hover:bg-theme-primary/20"
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

							<div className="EditBox flex gap-4 items-center ml-auto">
								<span className="CreatedAt text-sub-text">
									{dateConvert(localDetail?.createdAt)}
								</span>
								{isAdmin && (
									<div className="flex items-center gap-3">
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													onClick={handleTogglePin}
													className={cn(
														"w-8 h-8 rounded-full flex items-center justify-center border border-card cursor-pointer",
														isPinned ? "text-theme-primary" : "text-sub-text"
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
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													onClick={onClickMoveToPage(
														`/library/${localDetail?.id}/edit`
													)}
													className="w-8 h-8 rounded-full flex items-center justify-center border border-card text-sub-text cursor-pointer"
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
													className="w-8 h-8 rounded-full flex items-center justify-center border border-card text-sub-text cursor-pointer"
													style={{ transition: "color 200ms ease-out" }}
													aria-label="삭제"
												>
													<Trash2 size={16} />
												</button>
											</TooltipTrigger>
											<TooltipContent className="text-xs">삭제</TooltipContent>
										</Tooltip>
									</div>
								)}
							</div>
						</div>
					</div>
					<Separator className="mb-[60px] mt-7 bg-card-border" />
					{requiresPassword ? (
						<div className="mt-12 p-6 border-card rounded-card bg-card-bg">
							<p className="text-main-text font-medium">
								비밀번호가 필요한 게시글입니다.
							</p>
							<div className="mt-4 flex items-center gap-2">
								<Input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="비밀번호를 입력해주세요."
									className="flex-1"
								/>
								<Button
									type="button"
									onClick={handleVerifyPassword}
									disabled={isVerifying}
								>
									확인
								</Button>
							</div>
							{passwordError && (
								<p className="mt-2 text-xs text-red-500">
									{passwordError}
								</p>
							)}
						</div>
					) : !parsedContent || !editor || editor.isEmpty ? (
						<p className="text-sub-text">내용이 없습니다.</p>
					) : (
						<EditorContent editor={editor} />
					)}
				</div>
				<div className="PrevNextWrap flex justify-between mt-24">
					{localDetail?.prevPost ? (
						<div
							className="PrevNextBox prev flex-none flex items-center cursor-pointer rounded-card max-w-52 p-3 border-card bg-card-bg overflow-hidden group min-w-48"
							onClick={onClickMoveToPage(
								`/library/${localDetail?.prevPost?.slug || localDetail?.prevPost?.id}${detailQuery}`
							)}
						>
							<div
								className="PrevNextIconBox prevIcon w-12 h-12 flex-none flex items-center justify-center rounded-full bg-gray-300 group-hover:-translate-x-1"
								style={{ transition: "all 300ms ease-in-out" }}
							>
								<ChevronLeft size={20} className="text-gray-600" />
							</div>
							<div className="PrevNextTextBox overflow-hidden w-[calc(100% - 48px)] pl-3.5">
								<span className="PrevNextText text-sm text-sub-text">
									이전 글
								</span>
								<p
									className="PrevNextTitle text-xl font-semibold text-sub-text whitespace-nowrap overflow-hidden text-ellipsis w-full group-hover:text-gray-500"
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
							className="PrevNextBox next flex-none flex items-center cursor-pointer rounded-card max-w-52 p-3 border-card bg-card-bg overflow-hidden flex-row-reverse group min-w-48"
							onClick={onClickMoveToPage(
								`/library/${localDetail?.nextPost?.slug || localDetail?.nextPost?.id}${detailQuery}`
							)}
						>
							<div
								className="PrevNextIconBox nextIcon w-12 h-12 flex-none flex items-center justify-center rounded-full bg-gray-300 group-hover:translate-x-1"
								style={{ transition: "all 300ms ease-in-out" }}
							>
								<ChevronRight size={20} className="text-gray-600" />
							</div>
							<div className="PrevNextTextBox overflow-hidden w-[calc(100% - 48px)] pr-3.5 flex flex-col items-end">
								<span className="PrevNextText text-sm text-sub-text">
									다음 글
								</span>
								<p
									className="PrevNextTitle text-xl font-semibold text-sub-text whitespace-nowrap overflow-hidden text-ellipsis w-full text-end group-hover:text-gray-500"
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
			</div>
		</div>
	);
}
