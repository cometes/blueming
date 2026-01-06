"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMoveToPage } from "@/hooks/useMoveToPage";
import { dateConvert } from "@/lib/date";
import Fallback from "@/components/common/Fallback";
import AdminOnly from "@/components/common/AdminOnly";

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
	data: SeriesPost[];
}

interface SeriesClientProps {
	seriesListData: SeriesData | null;
}

export default function SeriesClient({ seriesListData }: SeriesClientProps) {
	const [isSorted, setIsSorted] = useState(false);
	const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
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

	const sortedData = isSorted
		? [...seriesListData.data].reverse()
		: seriesListData.data;

	return (
		<div className="w-full max-w-3xl mx-auto mt-20 mb-10">
			<Button
				onClick={onClickMoveToPage("/library/")}
				variant="outline"
				className="mb-10"
			>
				목록으로
			</Button>

			{/* Title Section */}
			<div className="flex items-end mt-10">
				{/* Title Image */}
				<div className="h-40 aspect-[4.5/3] bg-card border border-card-border rounded-lg relative overflow-hidden">
					{seriesListData.lastUpdatedThumbnail && !failedImages.header ? (
						<Image
							src={seriesListData.lastUpdatedThumbnail}
							alt={seriesListData.series}
							fill
							className="object-cover transition-transform duration-200 hover:scale-110"
							onError={() => markFailed("header")}
						/>
					) : (
						<Fallback />
					)}
				</div>

				{/* Title Box */}
				<div className="py-5 ml-6">
					<h1 className="text-6xl font-bold">{seriesListData.series}</h1>
					<p className="text-base mt-3 text-sub-text">
						{seriesListData.data.length}개의 포스트
					</p>
				</div>
			</div>

			{/* Divider */}
			<div className="h-px bg-card-border mt-10" />

			{/* Edit Buttons */}
			<AdminOnly>
				<div className="mt-8">
					<div className="flex justify-end">
						<button className="text-base text-sub-text-light border-none bg-transparent cursor-pointer hover:text-main-text transition-colors">
							수정
						</button>
						<button className="text-base text-sub-text-light border-none bg-transparent cursor-pointer ml-3 hover:text-main-text transition-colors">
							삭제
						</button>
					</div>
				</div>
			</AdminOnly>

			{/* Sort Button */}
			<div className="flex justify-end mt-5">
				<div
					className="flex items-center cursor-pointer bg-card px-3 py-2 rounded-md hover:bg-card/80 transition-colors"
					onClick={() => {
						setIsSorted((prev) => !prev);
					}}
				>
					{isSorted ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
					<span className="text-base ml-2">
						{isSorted ? "내림" : "오름"}차순
					</span>
				</div>
			</div>

			{/* Posts List */}
			<ul>
				{sortedData.map((el, index) => (
					<li key={el.id} className="list-none mt-[60px]">
						{/* Post Title */}
						<h2
							className="flex cursor-pointer"
							onClick={onClickMoveToPage(`/library/${el.id}`)}
						>
							<span className="block text-sub-text italic text-[2.2rem] font-semibold">
								{isSorted ? sortedData.length - index : index + 1}.
							</span>
							<span className="block text-sub-text-dark text-[2.2rem] font-semibold ml-2.5 hover:text-theme-primary transition-colors">
								{el.title}
							</span>
						</h2>

						{/* Post Content */}
						<div className="flex items-center mt-2.5">
							{/* Post Image */}
							<div
								className="h-[120px] aspect-[4.5/3] bg-card border border-card-border rounded-md cursor-pointer overflow-hidden relative"
								onClick={onClickMoveToPage(`/library/${el.id}`)}
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
									<Fallback />
								)}
							</div>

							{/* Post Info */}
							<div className="py-5 h-[120px] ml-4 flex flex-col justify-between">
								<p className="text-sub-text cursor-pointer hover:text-main-text transition-colors">
									{el.subtitle}
								</p>
								<span className="text-sub-text text-sm">
									{dateConvert(el.createdAt)}
								</span>
							</div>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
