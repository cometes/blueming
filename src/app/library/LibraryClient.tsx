"use client";

import { useEffect, useState } from "react";
import ItemCard from "@/components/items/Card";
import ItemGallery from "@/components/items/Gallery";
import { Plus, Search, Settings } from "lucide-react";
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
import ItemList from "@/components/items/List";
import LibrarySettingsDialog from "@/components/modal/LibrarySettingsDialog";

interface LibraryItem {
	id: string;
	title: string;
	subtitle?: string;
	slug?: string;
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

	// 페이지 설정 상태
	const [layoutType, setLayoutType] = useState<"list" | "listWithImage">(
		"listWithImage"
	);
	const [postsPerPage, setPostsPerPage] = useState(10);
	const [postsPerRow, setPostsPerRow] = useState(3);
	const [writePermission, setWritePermission] = useState<"admin" | "member">(
		"admin"
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Dialog 임시 상태 (저장 전까지 사용)
	const [tempLayoutType, setTempLayoutType] = useState(layoutType);
	const [tempPostsPerPage, setTempPostsPerPage] = useState(postsPerPage);
	const [tempPostsPerRow, setTempPostsPerRow] = useState(postsPerRow);
	const [tempWritePermission, setTempWritePermission] =
		useState(writePermission);

	// 로컬 스토리지에서 상태 불러오기
	useEffect(() => {
		const savedIsSeriesOn = localStorage.getItem("isSeriesOn");
		const savedIsCardOn = localStorage.getItem("isCardOn");
		const savedSegmentedValue = localStorage.getItem("segmentedValue");
		const savedLayoutType = localStorage.getItem("layoutType");
		const savedPostsPerPage = localStorage.getItem("postsPerPage");
		const savedPostsPerRow = localStorage.getItem("postsPerRow");
		const savedWritePermission = localStorage.getItem("writePermission");

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

		if (savedLayoutType !== null) {
			const type = savedLayoutType as "list" | "listWithImage";
			setLayoutType(type);
			setTempLayoutType(type);
		}
		if (savedPostsPerPage !== null) {
			const count = parseInt(savedPostsPerPage);
			setPostsPerPage(count);
			setTempPostsPerPage(count);
		}
		if (savedPostsPerRow !== null) {
			const count = parseInt(savedPostsPerRow);
			setPostsPerRow(count);
			setTempPostsPerRow(count);
		}
		if (savedWritePermission !== null) {
			const permission = savedWritePermission as "admin" | "member";
			setWritePermission(permission);
			setTempWritePermission(permission);
		}
	}, []);

	// 상태 변경 시 로컬 스토리지에 저장
	useEffect(() => {
		localStorage.setItem("isSeriesOn", isSeriesOn.toString());
		localStorage.setItem("isCardOn", isCardOn.toString());
		localStorage.setItem("segmentedValue", segmentedValue);
		localStorage.setItem("layoutType", layoutType);
		localStorage.setItem("postsPerPage", postsPerPage.toString());
		localStorage.setItem("postsPerRow", postsPerRow.toString());
		localStorage.setItem("writePermission", writePermission);
	}, [
		isSeriesOn,
		isCardOn,
		segmentedValue,
		layoutType,
		postsPerPage,
		postsPerRow,
		writePermission,
	]);

	// Dialog가 열릴 때 현재 설정값으로 임시 상태 초기화
	useEffect(() => {
		if (isDialogOpen) {
			setTempLayoutType(layoutType);
			setTempPostsPerPage(postsPerPage);
			setTempPostsPerRow(postsPerRow);
			setTempWritePermission(writePermission);
		}
	}, [isDialogOpen, layoutType, postsPerPage, postsPerRow, writePermission]);

	// 설정 저장 핸들러
	const handleSaveSettings = () => {
		setLayoutType(tempLayoutType);
		setPostsPerPage(tempPostsPerPage);
		setPostsPerRow(tempPostsPerRow);
		setWritePermission(tempWritePermission);
		setIsDialogOpen(false);
	};

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
					<AdminOnly>
						<LibrarySettingsDialog
							isOpen={isDialogOpen}
							onOpenChange={setIsDialogOpen}
							tempLayoutType={tempLayoutType}
							setTempLayoutType={setTempLayoutType}
							tempPostsPerPage={tempPostsPerPage}
							setTempPostsPerPage={setTempPostsPerPage}
							tempPostsPerRow={tempPostsPerRow}
							setTempPostsPerRow={setTempPostsPerRow}
							tempWritePermission={tempWritePermission}
							setTempWritePermission={setTempWritePermission}
							onSave={handleSaveSettings}
							trigger={
								<Button className="bg-card border-card text-main-text rounded-full w-10 h-10">
									<Settings />
								</Button>
							}
						/>
					</AdminOnly>

					{writePermission === "admin" ? (
						<AdminOnly>
							<Button
								onClick={onClickMoveToPage("/library/new/")}
								className="bg-theme-primary hover:bg-theme-primary/90"
							>
								<Plus size={14} />새 글쓰기
							</Button>
						</AdminOnly>
					) : (
						<Button
							onClick={onClickMoveToPage("/library/new/")}
							className="bg-theme-primary hover:bg-theme-primary/90"
						>
							<Plus size={14} />새 글쓰기
						</Button>
					)}
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
					<div
						className={cn("grid gap-2.5 mt-10", `grid-cols-${postsPerRow}`)}
						style={{
							gridTemplateColumns: `repeat(${postsPerRow}, minmax(0, 1fr))`,
						}}
					>
						{seriesData?.slice(0, postsPerPage).map((el) => (
							<ItemCard data={el} key={el.id} />
						))}
					</div>
				)}
				{!isSeriesOn && (
					<div
						className={cn(
							"grid mt-10",
							isCardOn
								? `gap-2.5 grid-cols-${postsPerRow}`
								: "gap-4 grid-cols-1"
						)}
						style={
							isCardOn
								? { gridTemplateColumns: `repeat(${postsPerRow}, minmax(0, 1fr))` }
								: undefined
						}
					>
						{isCardOn && (
							<>
								{listData.slice(0, postsPerPage).map((el) => (
									<ItemGallery data={el} key={el.id} />
								))}
							</>
						)}
						{!isCardOn && layoutType === "listWithImage" && (
							<>
								{listData.slice(0, postsPerPage).map((el) => (
									<ItemListWithImage data={el} key={el.id} />
								))}
							</>
						)}
						{!isCardOn && layoutType === "list" && (
							<>
								{listData.slice(0, postsPerPage).map((el) => (
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
