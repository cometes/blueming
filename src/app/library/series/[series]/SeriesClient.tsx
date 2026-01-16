"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateConvert } from "@/lib/date";
import { cn } from "@/lib/utils";
import Fallback from "@/components/common/Fallback";
import AdminOnly from "@/components/common/AdminOnly";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/tiptap-ui-primitive/tooltip/tooltip";
import SeriesEditDialog from "@/components/modal/SeriesEditDialog";
import Image from "next/image";

interface SeriesPost {
	id: string;
	title: string;
	subtitle?: string;
	thumbnail?: string;
	createdAt: string;
}

interface SeriesData {
	series: string;
	lastUpdatedThumbnail?: string;
	lastUpdatedDate?: string;
	data: SeriesPost[];
}

interface SeriesClientProps {
	seriesListData: SeriesData | null;
}

type EditableSeriesPost = SeriesPost & {
	included: boolean;
};

export default function SeriesClient({ seriesListData }: SeriesClientProps) {
	const [isSorted, setIsSorted] = useState(false);
	const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
	const [isEditOpen, setIsEditOpen] = useState(false);
	const { onClickMoveToPage } = useMoveToPage();

	const markFailed = (key: string) => {
		setFailedImages((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
	};

	if (!seriesListData) {
		return (
			<div className="w-full max-w-3xl mx-auto mt-20 mb-10">
				<p className="text-center text-sub-text">
					시리즈 데이터를 불러올 수 없습니다.
				</p>
			</div>
		);
	}

	const [seriesMeta, setSeriesMeta] = useState(() => ({
		name: seriesListData.series,
		thumbnail: seriesListData.lastUpdatedThumbnail ?? "",
		posts: seriesListData.data.map((post) => ({
			...post,
			included: true,
		})),
	}));
	const [draftMeta, setDraftMeta] = useState(seriesMeta);

	useEffect(() => {
		if (!isEditOpen) return;
		setDraftMeta(seriesMeta);
	}, [isEditOpen, seriesMeta]);

	useEffect(() => {
		setFailedImages((prev) =>
			prev.header ? { ...prev, header: false } : prev
		);
	}, [seriesMeta.thumbnail]);

	const sortedData = useMemo(() => {
		const base = seriesMeta.posts.filter((post) => post.included);
		return isSorted ? [...base].reverse() : base;
	}, [isSorted, seriesMeta.posts]);

	return (
		<div className="w-full max-w-3xl mx-auto mt-20 mb-20">
			<Button
				onClick={onClickMoveToPage("/library?tab=series")}
				variant="outline"
				className="mb-10"
			>
				목록으로
			</Button>

			{/* Title Section */}
			<div className="mt-10">
				{/* Title Image */}
				<div
					className="relative w-full min-h-80 rounded-card overflow-hidden flex items-end"
					style={
						seriesMeta.thumbnail && !failedImages.header
							? {
									backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%), url(${seriesMeta.thumbnail})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
							  }
							: undefined
					}
				>
					{/* Title Box */}
					<div className="flex flex-col justify-between h-full px-8 py-6">
						<div>
							<h1 className="text-3xl font-semibold">{seriesMeta.name}</h1>
							<span className="text-sm text-sub-text mt-3 block">
								마지막 업데이트{" "}
								{seriesListData.lastUpdatedDate
									? dateConvert(seriesListData.lastUpdatedDate)
									: "-"}
							</span>
						</div>

						<p className="">{seriesMeta.posts.length}개의 포스트</p>
					</div>
				</div>
			</div>

			{/* Divider */}
			<div className="h-px bg-card-border mt-10" />

			{/* Edit Buttons */}
			<AdminOnly>
				<div className="mt-8">
					<div className="flex justify-end">
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="w-8 h-8 rounded-full flex items-center justify-center border border-card text-sub-text cursor-pointer hover:text-main-text"
									style={{ transition: "color 200ms ease-out" }}
									aria-label="수정"
									onClick={() => setIsEditOpen(true)}
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
									className="w-8 h-8 rounded-full flex items-center justify-center border border-card text-sub-text cursor-pointer hover:text-main-text ml-3"
									style={{ transition: "color 200ms ease-out" }}
									aria-label="삭제"
								>
									<Trash2 size={16} />
								</button>
							</TooltipTrigger>
							<TooltipContent className="text-xs">삭제</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</AdminOnly>

			<SeriesEditDialog
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
				draft={draftMeta}
				setDraft={setDraftMeta}
				onCancel={() => {
					setDraftMeta(seriesMeta);
					setIsEditOpen(false);
				}}
				onSave={() => {
					setSeriesMeta(draftMeta);
					setIsEditOpen(false);
				}}
			/>

			{/* Sort Button */}
			<div className="flex justify-end mt-5">
				<button
					type="button"
					onClick={() => {
						setIsSorted((prev) => !prev);
					}}
					className="text-theme-primary font-medium inline-flex items-center gap-1 hover:opacity-70 cursor-pointer"
					style={{ transition: "opacity 0.2s ease-out" }}
				>
					{isSorted ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
					<span className="text-base ml-2">
						{isSorted ? "내림" : "오름"}차순
					</span>
				</button>
			</div>

			{/* Posts List */}
			<ul>
				{sortedData.map((el, index) => (
					<li key={el.id} className="list-none mt-[60px]">
						{/* Post Content */}
						<div className="flex items-center mt-2.5">
							{/* Post Image */}
							<div
								className="h-[120px] aspect-video bg-card border border-card-border rounded-md cursor-pointer overflow-hidden relative"
								onClick={onClickMoveToPage(
									`/library/${el.slug || el.id}`
								)}
							>
								{el.thumbnail && !failedImages[el.id] ? (
									<Image
										src={el.thumbnail}
										alt={el.title}
										fill
										className="object-cover transition-transform duration-200 hover:scale-110"
										onError={() => markFailed(el.id)}
									/>
								) : (
									null
								)}
							</div>

							{/* Post Info */}
							<div className="p-4 flex flex-col justify-between h-30">
								{/* Post Title */}
								<h2
									className="flex cursor-pointer"
									onClick={onClickMoveToPage(
										`/library/${el.slug || el.id}`
									)}
								>
									<span className="block text-sub-text italic text-2xl font-semibold">
										{isSorted ? sortedData.length - index : index + 1}.
									</span>
									<span className="block text-sub-text-dark text-2xl font-semibold ml-2.5 hover:text-theme-primary transition-colors">
										{el.title}
									</span>
								</h2>
								<div className="">
									<p className="text-sub-text cursor-pointer hover:text-main-text transition-colors">
										{el.subtitle}
									</p>
									<span className="text-sub-text text-sm">
										{dateConvert(el.createdAt)}
									</span>
								</div>
							</div>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
