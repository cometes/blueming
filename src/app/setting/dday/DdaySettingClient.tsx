"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Plus, Save } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import DdayItem from "@/features/settings/components/dday/DdayItem";
import DdayAddDialog from "@/features/settings/components/DdayAddDialog";
import RadioItem from "@/components/items/RadioItem";
import { setSettingsMainDday } from "@/features/settings/api/main";
import type { DdayData, DdayDisplayMode } from "@/features/settings/types";

const MAX_DDAY = 8;

const DISPLAY_MODES: Array<{ value: DdayDisplayMode; label: string }> = [
	{ value: "grid", label: "그리드 (전부 표시)" },
	{ value: "fade", label: "페이드 전환" },
	{ value: "slide", label: "슬라이드 전환" },
];

export default function DdaySettingClient() {
	const settings = useSettings();
	const refreshSettings = settings.refreshSettings;
	const updateMain = settings.updateMain;
	const [ddayList, setDdayList] = useState<DdayData[]>([]);
	const [displayMode, setDisplayMode] = useState<DdayDisplayMode>("grid");
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [showResetDialog, setShowResetDialog] = useState(false);
	const [isSyncing, setIsSyncing] = useState(true);
	const isDirty = useMemo(() => {
		if (isSyncing) return false;
		const baseline = settings.main?.dday || [];
		const baselineMode = settings.main?.ddayDisplayMode || "grid";
		return (
			JSON.stringify(ddayList) !== JSON.stringify(baseline) ||
			displayMode !== baselineMode
		);
	}, [ddayList, displayMode, settings.main?.dday, settings.main?.ddayDisplayMode, isSyncing]);
	useSettingStatus("dday", isDirty ? "dirty" : "saved");
	useSettingHeaderAction(
		<Button
			type="submit"
			form="setting-form-dday"
			variant="ghost"
			size="icon"
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
		[isDirty]
	);

	// Load from settings
	useEffect(() => {
		setIsSyncing(true);
		if (settings.main?.dday) {
			setDdayList(settings.main.dday);
		}
		setDisplayMode(settings.main?.ddayDisplayMode || "grid");
		setIsSyncing(false);
	}, [settings.main?.dday, settings.main?.ddayDisplayMode]);

	// Add dday
	const handleAddDday = useCallback(
		(ddayData: Omit<DdayData, "id" | "uniqueId">) => {
			if (ddayList.length >= MAX_DDAY) {
				toast.error(`최대 ${MAX_DDAY}개의 디데이까지 추가할 수 있습니다.`);
				return;
			}

			const newDday: DdayData = {
				id: `${ddayList.length + 1}`,
				uniqueId: uuidv4(),
				...ddayData,
			};

			setDdayList([...ddayList, newDday]);
		},
		[ddayList]
	);

	// Update dday
	const handleUpdateDday = useCallback(
		(index: number, updated: Partial<DdayData>) => {
			setDdayList((prev) => {
				const newList = [...prev];
				newList[index] = { ...newList[index], ...updated };
				return newList;
			});
		},
		[]
	);

	// Delete dday
	const handleDeleteDday = useCallback((id: string) => {
		setDdayList((prev) => {
			const filtered = prev.filter((dday) => dday.id !== id);
			return filtered.map((dday, index) => ({
				...dday,
				id: `${index + 1}`,
			}));
		});
	}, []);

	// Drag end
	const handleDragEnd = useCallback((result: DropResult) => {
		const { destination, source } = result;
		if (!destination || destination.index === source.index) return;

		setDdayList((prev) => {
			const newList = [...prev];
			const [movedItem] = newList.splice(source.index, 1);
			newList.splice(destination.index, 0, movedItem);

			return newList.map((dday, index) => ({
				...dday,
				id: `${index + 1}`,
			}));
		});
	}, []);

	// Save
	const handleSave = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			try {
				await setSettingsMainDday(ddayList, displayMode);
				updateMain?.({ dday: ddayList, ddayDisplayMode: displayMode });
				await refreshSettings?.({ broadcast: true });

				const channel = new BroadcastChannel("ddayUpdated");
				channel.postMessage({ dday: ddayList, timestamp: Date.now() });
				channel.close();

				toast.success("저장되었습니다.");
			} catch {
				toast.error("저장에 실패했습니다.");
			}
		},
		[ddayList, displayMode, refreshSettings, updateMain]
	);

	// Reset
	const handleReset = useCallback(async () => {
		try {
			await setSettingsMainDday([]);
			updateMain?.({ dday: [] });
			await refreshSettings?.({ broadcast: true });
			setDdayList([]);

			const channel = new BroadcastChannel("ddayUpdated");
			channel.postMessage({ dday: [], timestamp: Date.now() });
			channel.close();

			toast.success("디데이 설정이 초기화되었습니다.");
			setShowResetDialog(false);
		} catch {
			toast.error("디데이 초기화에 실패했습니다.");
		}
	}, [refreshSettings, updateMain]);

	return (
		<>
			<DdayAddDialog
				isOpen={isAddDialogOpen}
				onOpenChange={setIsAddDialogOpen}
				onAdd={handleAddDday}
			/>

			<form id="setting-form-dday" onSubmit={handleSave} className="space-y-8">
				<section>
					<h2 className="text-[20px] font-semibold font-title">디데이 설정</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
						디데이를 설정합니다. 드래그 앤 드롭으로 순서를 변경할 수 있습니다.
						최대 {MAX_DDAY}개까지 추가 가능합니다.
					</p>

					<div className="section-wrap mt-6">
						<div className="section-box flex items-center mb-6">
							<div className="text-box w-[220px] pr-5">
								<h3 className="font-medium text-sub-text">위젯 표시 방식</h3>
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									위젯에 추가된 디데이가 여러 개일 때 보여지는 방식
								</p>
							</div>
							<div className="grid grid-cols-3 gap-3">
								{DISPLAY_MODES.map((mode) => (
									<RadioItem
										key={mode.value}
										onClickRadio={() => setDisplayMode(mode.value)}
										checked={displayMode === mode.value}
										content={mode.label}
									/>
								))}
							</div>
						</div>

						<div className="flex justify-end mb-6">
							<Button type="button" onClick={() => setIsAddDialogOpen(true)}>
								<Plus size={14} className="mr-2" />
								디데이 추가하기
							</Button>
						</div>

						<DragDropContext onDragEnd={handleDragEnd}>
							<Droppable droppableId="ddayList">
								{(provided) => (
									<div
										ref={provided.innerRef}
										{...provided.droppableProps}
										className="space-y-4"
									>
										{ddayList.map((dday, index) => (
											<DdayItem
												key={dday.uniqueId}
												dday={dday}
												index={index}
												onUpdate={(updated) => handleUpdateDday(index, updated)}
												onDelete={handleDeleteDday}
											/>
										))}
										{provided.placeholder}
									</div>
								)}
							</Droppable>
						</DragDropContext>

						{ddayList.length === 0 && (
							<div className="text-center py-12 text-muted-foreground">
								디데이를 추가해주세요
							</div>
						)}
					</div>
				</section>

				<Separator className="my-12" />

				<div className="flex justify-end gap-3 pt-6">
					<Button
						type="button"
						onClick={() => setShowResetDialog(true)}
						className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
						style={{
							transition: "all 0.3s ease-in-out",
						}}
					>
						초기화하기
					</Button>
					{/* 저장 버튼은 헤더로 이동 */}
				</div>
			</form>

			{/* Reset Dialog */}
			<Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
				<DialogContent className="rounded-card border-card bg-card-bg backdrop-blur-sm">
					<DialogHeader>
						<DialogTitle>디데이 초기화</DialogTitle>
						<DialogDescription>
							정말 디데이 설정을 초기화할까요? 모든 디데이가 삭제됩니다.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowResetDialog(false)}
							className="rounded-card border-card bg-card-bg"
						>
							취소
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleReset}
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
		</>
	);
}
