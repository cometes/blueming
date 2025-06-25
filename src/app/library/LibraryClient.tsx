"use client";

import { useEffect, useState } from "react";
import ItemCard from "@/components/items/Card";
import ItemGallery from "@/components/items/Gallery";
import ItemList from "@/components/items/List";
import { Plus, Search } from "lucide-react";
import AdminOnly from "@/components/common/AdminOnly";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface LibraryClientProps {
	listData: any[];
	seriesData: any[];
}

export default function LibraryClient({
	listData,
	seriesData,
}: LibraryClientProps) {
	const [isSeriesOn, setIsSeriesOn] = useState(false);
	const [isCardOn, setIsCardOn] = useState(false);
	const [segmentedValue, setSegmentedValue] = useState("row");

	// 로컬 스토리지에서 상태 불러오기
	useEffect(() => {
		const savedIsSeriesOn = localStorage.getItem("isSeriesOn");
		const savedIsCardOn = localStorage.getItem("isCardOn");
		const savedSegmentedValue = localStorage.getItem("segmentedValue");

		if (savedIsSeriesOn !== null) {
			setIsSeriesOn(savedIsSeriesOn === "true");
		}
		if (savedIsCardOn !== null) {
			setIsCardOn(savedIsCardOn === "true");
		}
		if (savedSegmentedValue !== null) {
			setSegmentedValue(savedSegmentedValue);
		} else if (savedIsCardOn === "true") {
			setSegmentedValue("gallery");
		}
	}, []);

	// 상태 변경 시 로컬 스토리지에 저장
	useEffect(() => {
		localStorage.setItem("isSeriesOn", isSeriesOn.toString());
		localStorage.setItem("isCardOn", isCardOn.toString());
		localStorage.setItem("segmentedValue", segmentedValue);
	}, [isSeriesOn, isCardOn, segmentedValue]);

	return (
		<>
			<div
				className={cn(
					"shrink-0 w-full   max-w-3xl mt-[90px] mb-[40px]",
					isSeriesOn ? "" : ""
				)}
			>
				<div className="flex justify-center items-center gap-2.5">
					<button
						className={cn(
							isCardOn ? "row" : "row active border-card bg-card",
							"w-10 h-10 rounded-card p-2.5 cursor-pointer flex flex-col justify-between"
						)}
						onClick={() => {
							setIsCardOn(false);
							setIsSeriesOn(false);
						}}
					>
						<span className="w-full h-[3px] rounded-[1px] bg-[#dee2e6]" />
						<span className="w-full h-[3px] rounded-[1px] bg-[#dee2e6]" />
						<span className="w-full h-[3px] rounded-[1px] bg-[#dee2e6]" />
					</button>
					<button
						className={cn(
							isCardOn ? "gallery active border-card bg-card" : "gallery",
							"w-10 h-10 rounded-card p-2.5 cursor-pointer grid grid-cols-2 gap-0.5"
						)}
						onClick={() => {
							setIsCardOn(true);
							setIsSeriesOn(false);
						}}
					>
						<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
						<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
						<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
						<span className="w-full h-full rounded-[1px] bg-[#dee2e6]" />
					</button>
					<div className="flex items-center w-fit h-full">
						<Input
							className="border-card bg-card backdrop-blur-card rounded-card text-main-text"
							endIcon={Search}
						/>
					</div>
					<AdminOnly
						loadingSkeleton={<Skeleton className="h-9 w-[82px] rounded-card" />}
					>
						<Button
							// onClick={onClickMoveToPage("/library/new/")}
							icon={<Plus size={14} />}
						>
							새 글쓰기
						</Button>
					</AdminOnly>
				</div>
				<div className="TabWrap w-fit mx-auto mt-7">
					<div className="TabBox flex justify-center">
						<button
							className="Tab block font-medium text-sub-text bg-transparent px-2.5 py-4 border-0 min-w-20 cursor-pointer"
							onClick={() => {
								setIsSeriesOn(false);
							}}
						>
							글
						</button>
						<button
							className="Tab block font-medium text-sub-text bg-transparent px-2.5 py-4 border-0 min-w-20 cursor-pointer"
							onClick={() => {
								setIsSeriesOn(true);
							}}
						>
							시리즈
						</button>
					</div>
					<div
						className={cn(
							"h-0.5 bg-neutral-200 relative after:absolute after:top-0 after:block after:w-1/2 after:h-0.5 after:bg-sub-text after:transition-all after:duration-300 after:ease-in-out",
							isSeriesOn ? "after:right-0" : "after:right-1/2"
						)}
					/>
				</div>
				{isSeriesOn && (
					<div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(240px,1fr))] mt-10">
						{seriesData?.map((el) => (
							<ItemCard data={el} key={el.id} />
						))}
					</div>
				)}
				{!isSeriesOn && (
					<div
						className={cn(
							"grid mt-10",
							isCardOn ? "gap-2.5 grid-cols-3" : "gap-4 grid-cols-1"
						)}
					>
						{isCardOn && (
							<>
								{listData.map((el) => (
									<ItemGallery data={el} key={el.id} />
								))}
							</>
						)}
						{!isCardOn && (
							<>
								{listData.map((el) => (
									<ItemList data={el} key={el.id} />
								))}
							</>
						)}
					</div>
				)}
				<div className="flex justify-center mt-7">
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious href="#" />
							</PaginationItem>
							<PaginationItem>
								<PaginationLink href="#">1</PaginationLink>
							</PaginationItem>
							<PaginationItem>
								<PaginationEllipsis />
							</PaginationItem>
							<PaginationItem>
								<PaginationNext href="#" />
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			</div>
		</>
	);
}
