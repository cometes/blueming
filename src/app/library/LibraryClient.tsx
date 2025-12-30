"use client";

import { useEffect, useState } from "react";
import ItemCard from "@/components/items/Card";
import ItemGallery from "@/components/items/Gallery";
import {
	Lock,
	Plus,
	Rows3,
	Search,
	Settings,
	TableProperties,
	User,
} from "lucide-react";
import AdminOnly from "@/components/common/AdminOnly";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { useMoveToPage } from "@/hooks/useMoveToPage";
import ItemListWithImage from "@/components/items/ListWithImage";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface LibraryItem {
	id: string;
	title: string;
	subtitle?: string;
	createdAt: string;
	tags?: string[];
	thumbnail?: string;
}

interface LibraryClientProps {
	listData: LibraryItem[];
	seriesData: LibraryItem[];
}

export default function LibraryClient({
	listData,
	seriesData,
}: LibraryClientProps) {
	const [isSeriesOn, setIsSeriesOn] = useState(false);
	const [isCardOn, setIsCardOn] = useState(false);
	const [segmentedValue, setSegmentedValue] = useState("row");
	const { onClickMoveToPage } = useMoveToPage();

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
					<div className="relative flex rounded-card bg-transparent p-1">
						<div
							className={cn(
								"absolute top-1 w-10 h-10 rounded-card bg-card border border-card transition-all duration-300 ease-in-out shadow-sm",
								isCardOn ? "translate-x-10" : "translate-x-0"
							)}
						/>
						<button
							className="relative z-10 w-10 h-10 rounded-card p-2.5 cursor-pointer flex flex-col justify-between transition-colors duration-300"
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
							className="relative z-10 w-10 h-10 rounded-card p-2.5 cursor-pointer grid grid-cols-2 gap-0.5 transition-colors duration-300"
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
					</div>
					<div className="flex items-center w-fit h-full">
						<Input
							className="border-card bg-card backdrop-blur-card rounded-card text-main-text"
							endIcon={Search}
						/>
					</div>
					<Dialog>
						<DialogTrigger asChild>
							<Button className="bg-card border-card text-main-text rounded-full w-10 h-10">
								<Settings />
							</Button>
						</DialogTrigger>
						<DialogContent
							showCloseButton={false}
							className="bg-card border-card rounded-card backdrop-blur-card p-0"
						>
							<DialogHeader className="gap-0">
								<DialogTitle className="border-b border-card-border px-5 py-4 text-main-text flex items-center justify-between">
									<p> 페이지 설정</p>
									<Button>저장하기</Button>
								</DialogTitle>
								<DialogDescription className=" px-5 py-4 text-main-text">
									<div className="flex flex-col gap-4">
										<div>
											<p>페이지 레이아웃</p>
											<div className="flex gap-2 mt-2">
												<Button>
													<Rows3 /> 리스트형
												</Button>
												<Button>
													<TableProperties /> 리스트 이미지형
												</Button>
											</div>
										</div>
										<div>
											<p>페이지 당 게시글 수</p>
											<Input
												type="number"
												defaultValue={10}
												className="w-20 mt-2 bg-card border-card rounded-card text-main-text"
											/>
										</div>
										<div>
											<p>한 줄 당 게시글 수</p>
											<Input
												type="number"
												defaultValue={3}
												className="w-20 mt-2 bg-card border-card rounded-card text-main-text"
											/>
										</div>
										<div>
											<p>게시글 작성 권한</p>
											<div className="flex gap-2 mt-2">
												<Button>
													<Lock /> 관리자
												</Button>
												<Button>
													<User /> 회원
												</Button>
											</div>
										</div>
									</div>
								</DialogDescription>
							</DialogHeader>
						</DialogContent>
					</Dialog>

				<AdminOnly>
						<Button
							onClick={onClickMoveToPage("/library/new/")}
							className="bg-theme-primary hover:bg-theme-primary/90"
						>
							<Plus size={14} />새 글쓰기
						</Button>
					</AdminOnly>
				</div>
				<div className="TabWrap w-fit mx-auto mt-7">
					<div className="TabBox flex justify-center">
						<button
							className={cn(
								"Tab block font-medium text-sub-text bg-transparent px-2.5 py-4 border-0 min-w-20 cursor-pointer",
								isSeriesOn ? "" : "text-theme-primary"
							)}
							onClick={() => {
								setIsSeriesOn(false);
							}}
						>
							글
						</button>
						<button
							className={cn(
								"Tab block font-medium text-sub-text bg-transparent px-2.5 py-4 border-0 min-w-20 cursor-pointer",
								isSeriesOn ? "text-theme-primary" : ""
							)}
							onClick={() => {
								setIsSeriesOn(true);
							}}
						>
							시리즈
						</button>
					</div>
					<div
						className={cn(
							"h-0.5 bg-sub-text relative after:absolute after:top-0 after:block after:w-1/2 after:h-0.5 after:bg-theme-primary after:transition-all after:duration-300 after:ease-in-out",
							isSeriesOn ? "after:right-0" : "after:right-1/2"
						)}
					/>
				</div>
				{isSeriesOn && (
					<div className="grid gap-2.5 grid-cols-3 mt-10">
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
									// <ItemList data={el} key={el.id} />
									<ItemListWithImage data={el} key={el.id} />
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
							<PaginationItem>{/* <PaginationEllipsis /> */}</PaginationItem>
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
