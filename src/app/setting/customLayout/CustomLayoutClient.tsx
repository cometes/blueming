"use client";

import { Button } from "@/components/ui/button";
import { OctagonMinusIcon, Save } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { GridContainer } from "@/components/setting/customLayout/GridContainer";
import { DraggableWidget } from "@/components/setting/customLayout/DraggableWidget";
import { WidgetList } from "@/components/setting/customLayout/WidgetList";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { useCustomLayoutController } from "@/features/settings/hooks/useCustomLayoutController";

const widgetOptions = [
	{ label: "공지", value: "공지" },
	{ label: "슬라이드 배너", value: "슬라이드 배너" },
	{ label: "텍스트바", value: "텍스트바" },
	{ label: "프로필", value: "프로필" },
	{ label: "디데이", value: "디데이" },
	{ label: "최신글", value: "최신글" },
	{ label: "스티커보드", value: "스티커보드" },
	{ label: "날씨&시계", value: "날씨&시계" },
	{ label: "이미지 위젯 1", value: "이미지 위젯 1" },
	{ label: "이미지 위젯 2", value: "이미지 위젯 2" },
	{ label: "이미지 위젯 3", value: "이미지 위젯 3" },
	{ label: "이미지 위젯 4", value: "이미지 위젯 4" },
];

export default function CustomLayoutClient() {
	const {
		state: {
			selectedWidget,
			showClearDialog,
			isDesktopMode,
			activeLayout,
			activeWidgets,
			containerRef,
			desktopGrid,
			mobileGrid,
			isDirty,
		},
		actions: {
			setSelectedWidget,
			setShowClearDialog,
			setLayoutMode,
			handleAddWidget,
			handleRemoveWidget,
			handlePositionChange,
			handleSaveLayout,
			handleClearLayout,
		},
	} = useCustomLayoutController();

	useSettingHeaderAction(
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={handleSaveLayout}
			disabled={!isDirty}
			aria-label="저장하기"
			title="저장하기"
			className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
			style={{
				transition: "all 0.3s ease-in-out",
			}}
		>
			<Save size={16} />
		</Button>,
		[handleSaveLayout, isDirty],
	);

	return (
		<div className="space-y-8">
			<section>
				<h2 className="text-[20px] font-semibold font-title">커스텀 레이아웃 편집</h2>
				<div className="section-wrap mt-6">
					<div className="rounded-card border-card bg-card-bg p-6 backdrop-blur-sm">
						<ul className="space-y-1 text-sm text-sub-text">
							<li>• 위젯을 선택하고 추가하세요.</li>
							<li>• 드래그로 위치를 변경하고 크기를 조정할 수 있습니다.</li>
							<li>• 충분한 공간이 확보되어야 새로운 위젯을 추가할 수 있습니다.</li>
							<li>• 데스크톱/모바일 레이아웃을 전환해 각각 배치할 수 있습니다.</li>
						</ul>
					</div>
				</div>
			</section>

			<Separator className="my-12" />

			<section>
				<h2 className="text-[20px] font-semibold font-title">위젯 추가</h2>
				<div className="section-wrap mt-6">
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">추가할 위젯</h3>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								추가할 위젯을 선택하세요.
							</p>
						</div>
						<div className="flex flex-1 flex-col sm:flex-row gap-3">
							<Select value={selectedWidget} onValueChange={setSelectedWidget}>
								<SelectTrigger className="w-full sm:w-[200px] rounded-card border-card bg-card-bg">
									<SelectValue placeholder="위젯 선택" />
								</SelectTrigger>
								<SelectContent>
									{widgetOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button type="button" onClick={handleAddWidget}>
								추가하기
							</Button>
						</div>
					</div>
				</div>
			</section>

			<Separator className="my-12" />

			<section>
				<h2 className="text-[20px] font-semibold font-title">레이아웃 편집</h2>
				<div className="section-wrap mt-6">
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">편집 모드</h3>
							<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
								데스크톱/모바일 레이아웃을 전환합니다.
							</p>
						</div>
						<div className="flex flex-1 items-center">
							<div className="inline-flex rounded-card border-card bg-card-bg p-1">
								<button
									type="button"
									onClick={() => setLayoutMode("desktop")}
									className={`px-3 py-2 rounded-card text-sm font-medium transition-colors ${
										isDesktopMode
											? "bg-theme-primary text-white"
											: "text-sub-text hover:bg-card-bg/70"
									}`}
								>
									데스크톱 12×12
								</button>
								<button
									type="button"
									onClick={() => setLayoutMode("mobile")}
									className={`px-3 py-2 rounded-card text-sm font-medium transition-colors ${
										!isDesktopMode
											? "bg-theme-primary text-white"
											: "text-sub-text hover:bg-card-bg/70"
									}`}
								>
									모바일 8×12
								</button>
							</div>
						</div>
					</div>

					<div className="flex flex-col lg:flex-row gap-6 lg:gap-10 mt-4">
						<div className="w-full lg:w-3/4 flex justify-center">
							<GridContainer
								ref={containerRef}
								showGrid
								columns={isDesktopMode ? desktopGrid.columns : mobileGrid.columns}
								rows={isDesktopMode ? desktopGrid.rows : mobileGrid.rows}
								aspectRatio={isDesktopMode ? "5 / 4" : "2 / 3"}
								maxHeight={isDesktopMode ? undefined : "600px"}
								maxWidth={isDesktopMode ? undefined : "400px"}
							>
								{activeLayout.map((item) => {
									const widget = activeWidgets.find((w) => w.id === item.i);
									if (!widget) return null;
									return (
										<DraggableWidget
											key={item.i}
											id={item.i}
											gridPosition={{
												x: item.x,
												y: item.y,
												w: item.w,
												h: item.h,
											}}
											color={widget.color}
											label={widget.type}
											layout={activeLayout}
											containerRef={containerRef}
											onPositionChange={handlePositionChange}
											columns={isDesktopMode ? desktopGrid.columns : mobileGrid.columns}
											rows={isDesktopMode ? desktopGrid.rows : mobileGrid.rows}
										/>
									);
								})}
							</GridContainer>
						</div>

						<WidgetList widgets={activeWidgets} onRemove={handleRemoveWidget} />
					</div>
				</div>
			</section>

			<div className="flex justify-end gap-3 pt-6">
				<Button
					type="button"
					onClick={() => setShowClearDialog(true)}
					className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
					style={{
						transition: "all 0.3s ease-in-out",
					}}
				>
					<OctagonMinusIcon size={16} />
					초기화하기
				</Button>
			</div>

			<Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
				<DialogContent className="rounded-card border-card bg-card-bg backdrop-blur-sm">
					<DialogHeader>
						<DialogTitle>레이아웃 초기화</DialogTitle>
						<DialogDescription>
							정말 레이아웃을 초기화할까요? 모든 위젯이 제거됩니다.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="destructive"
							onClick={handleClearLayout}
							className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
							style={{
								transition: "all 0.3s ease-in-out",
							}}
						>
							초기화
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
