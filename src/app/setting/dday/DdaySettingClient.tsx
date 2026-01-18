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
import DdayItem from "@/components/items/DdayItem";
import DdayAddDialog from "@/components/modal/DdayAddDialog";
import {
	setSettingsMainDday,
	type DdayData,
} from "@/queries/set/setSettingsMainDday";

const MAX_DDAY = 8;

export default function DdaySettingClient() {
	const settings = useSettings();
	const refreshSettings = settings.refreshSettings;
	const updateMain = settings.updateMain;
	const [ddayList, setDdayList] = useState<DdayData[]>([]);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [showResetDialog, setShowResetDialog] = useState(false);
	const [isSyncing, setIsSyncing] = useState(true);
	const isDirty = useMemo(() => {
		if (isSyncing) return false;
		const baseline = settings.main?.dday || [];
		return JSON.stringify(ddayList) !== JSON.stringify(baseline);
	}, [ddayList, settings.main?.dday, isSyncing]);
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
		setIsSyncing(false);
	}, [settings.main?.dday]);

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
				await setSettingsMainDday(ddayList);
				updateMain?.({ dday: ddayList });
				await refreshSettings?.({ broadcast: true });

				const channel = new BroadcastChannel("ddayUpdated");
				channel.postMessage({ dday: ddayList, timestamp: Date.now() });
				channel.close();

				toast.success("저장되었습니다.");
			} catch {
				toast.error("저장에 실패했습니다.");
			}
		},
		[ddayList, refreshSettings, updateMain]
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
					<h2 className="text-[20px] font-semibold">디데이 설정</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
						디데이를 설정합니다. 드래그 앤 드롭으로 순서를 변경할 수 있습니다.
						최대 {MAX_DDAY}개까지 추가 가능합니다.
					</p>

					<div className="section-wrap mt-6">
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
