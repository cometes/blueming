"use client";

import { Slate, Editable } from "slate-react";
import { useMoveToPage } from "@/hooks/useMoveToPage";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useCreatePost } from "@/hooks/useCreatPost";
import CustomToolbar from "@/components/editor/CustomToolbar";

export default function LibararyNewClient({ seriesData, tagsData }) {
	// const { isModalOpen, setIsModalOpen, showModal, cancelModal } = useModal();
	const { onClickMoveToPage } = useMoveToPage();

	const {
		handleSubmit,
		onClickSubmit,
		editor,
		initialValue,
		getContent,
		currentAlign,
		setCurrentAlign,
		setPopupOpen,
		handlePopoverOpenChange,
		setValue,
		register,
		seriesArr,
		tagsArr,
		popupOpen,
		subOpen,
		setSubOpen,
		renderElement,
		renderLeaf,
		handleDrop,
	} = useCreatePost(seriesData, tagsData);

	return (
		<div className="w-full min-h-dvh">
			<Slate editor={editor} initialValue={initialValue} onChange={getContent}>
				{/* Header */}
				<header className="Header w-full h-[60px] border-b border-card-bg backdrop-blur-card fixed top-0 left-0 z-50">
					<div className="HeaderContainer px-20 h-full flex justify-between items-center">
						<Button onClick={onClickMoveToPage("/library/")}>뒤로가기</Button>
						<CustomToolbar
							currentAlign={currentAlign}
							setCurrentAlign={setCurrentAlign}
						/>
						{/* <Popover
							placement="bottomLeft"
							arrow={false}
							content={
								<MetaModal
									setPopupOpen={setPopupOpen}
									setValue={setValue}
									register={register}
									seriesArr={seriesArr}
									tagsArr={tagsArr}
									isModalOpen={isModalOpen}
									setIsModalOpen={setIsModalOpen}
									showModal={showModal}
									cancelModal={cancelModal}
								/>
							}
							trigger="click"
							open={popupOpen}
							onOpenChange={handlePopoverOpenChange}
							overlayInnerStyle={{
								width: "fit-content",
								background: "transparent",
								padding: 0,
								marginTop: "10px",
							}}
						>
							<Button>글쓰기</Button>
						</Popover> */}
						<Button>글쓰기</Button>
					</div>
				</header>
				{/* Body */}
				<div className="Container pt-[150px] pb-[100px] px-[60px] bg-card backdrop-blur-card w-[900px] min-h-dvh border-card flex flex-col m-auto">
					<div className="TitleWrap relative">
						<Input
							placeholder="제목을 입력해주세요."
							// {...register("title")}
							className="text-5xl border-0 text-main-text bg-background-none placeholder:text-sub-text focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:outline-0 p-0"
						/>
						<span
							className={cn(
								"SubTitleIconBox flex items-center justify-center absolute w-6 h-6 -left-10 bg-gray-300 border border-gray-400 text-gray-400 rounded-[3px] transition-all duration-300 ease cursor-pointer",
								subOpen ? "-bottom-[56px]" : "-bottom-6"
							)}
							onClick={() => {
								setSubOpen((prev) => !prev);
							}}
						>
							{subOpen ? <X size={16} /> : <Plus size={16} />}
						</span>
					</div>
					<div
						className={cn(
							"SubTitleWrap relative transition-all duration-500 ease overflow-hidden",
							subOpen ? "max-h-20 mt-6 opacity-100" : "max-h-0 mt-0 opacity-0"
						)}
					>
						<Input
							placeholder="소제목을 입력해주세요."
							// {...register("subtitle")}
							className="text-lg border-0 text-sub-text bg-background-none placeholder:text-sub-text focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:outline-0 transition-all duration-300 ease p-0"
						/>
					</div>
					<Separator className="mt-7" />
					<div className="EditorBox pt-12 relative flex flex-col grow">
						<Editable
							renderElement={renderElement}
							renderLeaf={renderLeaf}
							style={{
								height: "100%", // 부모 높이에 맞추기
								paddingBottom: "60px", // 하단 패딩 추가
								flexGrow: 1, // 남은 공간을 차지
								outline: "none",
							}}
							onDrop={handleDrop}
							autoFocus
							placeholder="내용을 입력해주세요"
						/>
					</div>
				</div>
			</Slate>
		</div>
	);
}
