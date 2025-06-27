"use client";

import { useCallback, useMemo, useState } from "react";
import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateConvert } from "@/lib/date";
import withVideo from "@/hooks/editor/UseWithVideo";
import { withInlines } from "@/hooks/editor/UseWithInline";
import { withImages } from "@/hooks/editor/UseWithImage";
import { withHistory } from "slate-history";
import { Editable, Slate, withReact } from "slate-react";
import { createEditor } from "slate";
import Leaf from "@/components/editor/Leaf";
import Viewer from "@/components/editor/Viewer";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function DetailClient({ detailData }) {
	const [isSeriesOn, setIsSeriesOn] = useState(false);

	const { onClickMoveToPage } = useMoveToPage();

	const editor = useMemo(() => {
		return withVideo(
			withInlines(withImages(withHistory(withReact(createEditor()))))
		);
	}, []);

	const renderLeaf = useCallback((props) => {
		return <Leaf {...props} />;
	}, []);

	const renderElement = useCallback((props) => {
		return <Viewer {...props} />;
	}, []);

	const initialValue = detailData?.content
		? JSON.parse(detailData.content)
		: [{ type: "paragraph", children: [{ text: "" }] }];

	const onClickMoveToSeries = (id) => () => {
		if (detailData?.id !== id) {
			onClickMoveToPage(`/library/${id}/`);
		}
	};

	return (
		<div className="Wrapper min-h-100vh">
			<div className="Container w-3xl min-h-dvh m-auto bg-card backdrop-blur-card border-card px-6 py-20 flex flex-col justify-between">
				<div>
					<div>
						<Button onClick={onClickMoveToPage("/library/")}>목록으로</Button>
					</div>
					<div className="TitleWrap mt-10">
						<h1 className="Title text-4xl text-main-text font-bold tracking-normal">
							{detailData?.title}
						</h1>
						<h2 className="Subtitle text-2xl text-sub-text mt-2.5 font-medium">
							{detailData?.subtitle}
						</h2>
						<div className="EditWrap flex justify-between items-center mt-10">
							{detailData?.tags?.length > 0 && (
								<div className="TagBox flex">
									{/* 태그 */}
									{detailData.tags?.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-1.5">
											{detailData.tags.map((tag, index) => (
												<Badge
													key={index}
													variant="secondary"
													className={cn(
														"px-3 text-xs font-medium rounded-full",
														"bg-theme-primary/10 text-theme-primary border-theme-primary/20",
														"hover:bg-theme-primary/20 transition-colors duration-200"
													)}
												>
													{tag}
												</Badge>
											))}
										</div>
									)}
								</div>
							)}

							<div className="EditBox flex gap-5">
								<span className="CreatedAt text-sub-text">
									{dateConvert(detailData?.createdAt)}
								</span>
								<span className="EditText text-sub-text cursor-pointer">
									수정
								</span>
								<span className="EditText text-sub-text cursor-pointer">
									삭제
								</span>
							</div>
						</div>
					</div>
					<Separator className="mb-[60px] mt-7 bg-card-border" />
					<div>
						<Slate
							key={detailData?.id}
							editor={editor}
							initialValue={initialValue}
						>
							<Editable
								readOnly
								renderElement={renderElement}
								renderLeaf={renderLeaf}
							/>
						</Slate>
					</div>
				</div>
				<div className="PrevNextWrap flex justify-between mt-24">
					{detailData?.prevPost && (
						<div
							className="PrevNextBox prev w-[200px] flex items-center cursor-pointer py-3 px-5 rounded-card bg-gray-200 max-w-52 overflow-hidden group"
							onClick={onClickMoveToPage(
								`/library/${detailData?.prevPost?.id}`
							)}
						>
							<div className="PrevNextIconBox prevIcon w-12 h-12 flex items-center justify-center rounded-full bg-gray-300 transition-all duration-300 ease-in-out group-hover:-translate-x-1">
								<ChevronLeft size={20} className="text-gray-600" />
							</div>
							<div className="PrevNextTextBox overflow-hidden w-[calc(100% - 48px)] pl-3.5">
								<span className="PrevNextText text-sm text-sub-text">
									이전 글
								</span>
								<p className="PrevNextTitle text-xl font-semibold text-sub-text whitespace-nowrap overflow-hidden text-ellipsis w-full group-hover:text-gray-500 transition-colors duration-300">
									{detailData?.prevPost?.title}
								</p>
							</div>
						</div>
					)}
					{detailData?.nextPost && (
						<div
							className="PrevNextBox next w-[200px] flex items-center cursor-pointer py-3 px-5 rounded-card bg-gray-200 max-w-52 overflow-hidden flex-row-reverse group"
							onClick={onClickMoveToPage(
								`/library/${detailData?.nextPost?.id}`
							)}
						>
							<div className="PrevNextIconBox nextIcon w-12 h-12 flex items-center justify-center rounded-full bg-gray-300 transition-all duration-300 ease-in-out group-hover:translate-x-1">
								<ChevronRight size={20} className="text-gray-600" />
							</div>
							<div className="PrevNextTextBox overflow-hidden w-[calc(100% - 48px)] pr-3.5 flex flex-col items-end">
								<span className="PrevNextText text-sm text-sub-text">
									다음 글
								</span>
								<p className="PrevNextTitle text-xl font-semibold text-sub-text whitespace-nowrap overflow-hidden text-ellipsis w-full text-end group-hover:text-gray-500 transition-colors duration-300">
									{detailData?.nextPost?.title}
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
