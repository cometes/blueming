"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
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
import SlideItem from "@/components/items/SlideItem";
import SlideAddDialog from "@/components/modal/SlideAddDialog";
import {
	setSettingsMainSlide,
	type SlideData,
} from "@/queries/set/setSettngMainSlide";

const MAX_SLIDES = 8;

export default function SlideSettingClient() {
	const settings = useSettings();
	const refreshSettings = settings.refreshSettings;
	const [slides, setSlides] = useState<SlideData[]>([]);
	const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
	const [showResetDialog, setShowResetDialog] = useState(false);
	const isDirty = useMemo(() => {
		const baseline = settings.main?.slide || [];
		return JSON.stringify(slides) !== JSON.stringify(baseline);
	}, [slides, settings.main?.slide]);
	useSettingStatus("slide", isDirty ? "dirty" : "saved");

	// Load from settings
	useEffect(() => {
		if (settings.main?.slide) {
			setSlides(settings.main.slide);
		}
	}, [settings.main?.slide]);

	// Add slide
	const handleAddSlide = useCallback(
		(data: { image: string; url: string; target: boolean }) => {
			if (slides.length >= MAX_SLIDES) {
				toast.error("최대 8장의 슬라이드까지 추가할 수 있습니다.");
				return;
			}

			const newSlide: SlideData = {
				id: `${slides.length + 1}`,
				uniqueId: uuidv4(),
				url: data.url,
				image: data.image,
				target: data.target,
			};

			setSlides([...slides, newSlide]);
			setIsUploadDialogOpen(false);
		},
		[slides]
	);

	// Update slide
	const handleUpdateSlide = useCallback(
		(index: number, updated: Partial<SlideData>) => {
			setSlides((prev) => {
				const newSlides = [...prev];
				newSlides[index] = { ...newSlides[index], ...updated };
				return newSlides;
			});
		},
		[]
	);

	// Delete slide
	const handleDeleteSlide = useCallback((id: string) => {
		setSlides((prev) => {
			const filtered = prev.filter((slide) => slide.id !== id);
			// Reorder IDs after deletion
			return filtered.map((slide, index) => ({
				...slide,
				id: `${index + 1}`,
			}));
		});
	}, []);

	// Drag end
	const handleDragEnd = useCallback((result: DropResult) => {
		const { destination, source } = result;
		if (!destination || destination.index === source.index) return;

		setSlides((prev) => {
			const newSlides = [...prev];
			const [movedItem] = newSlides.splice(source.index, 1);
			newSlides.splice(destination.index, 0, movedItem);

			// Reorder IDs
			return newSlides.map((slide, index) => ({
				...slide,
				id: `${index + 1}`,
			}));
		});
	}, []);

	// Save
	const handleSave = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			try {
				await setSettingsMainSlide(slides);
				await refreshSettings?.({ broadcast: true });

				// Broadcast
				const channel = new BroadcastChannel("slideUpdated");
				channel.postMessage({ slide: slides, timestamp: Date.now() });
				channel.close();

				toast.success("성공적으로 슬라이드 배너를 저장했습니다.");
			} catch {
				toast.error("슬라이드 배너를 저장하지 못했습니다.");
			}
		},
		[slides, refreshSettings]
	);

	// Reset
	const handleReset = useCallback(async () => {
		try {
			await setSettingsMainSlide([]);
			await refreshSettings?.({ broadcast: true });
			setSlides([]);

			// Broadcast
			const channel = new BroadcastChannel("slideUpdated");
			channel.postMessage({ slide: [], timestamp: Date.now() });
			channel.close();

			toast.success("슬라이드 배너가 초기화되었습니다.");
			setShowResetDialog(false);
		} catch {
			toast.error("슬라이드 배너 초기화에 실패했습니다.");
		}
	}, [refreshSettings]);

	return (
		<>
			<SlideAddDialog
				isOpen={isUploadDialogOpen}
				onOpenChange={setIsUploadDialogOpen}
				onAdd={handleAddSlide}
			/>

			<form onSubmit={handleSave} className="space-y-8">
				<section>
					<h2 className="text-[20px] font-semibold">슬라이드 배너 편집하기</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
						슬라이드 배너 이미지를 설정합니다. 드래그 앤 드롭으로 순서를 변경할
						수 있습니다. 최대 8장까지 추가 가능합니다.
					</p>

					<div className="section-wrap mt-6">
						{/* Add Button */}
						<div className="flex justify-end mb-6">
							<Button type="button" onClick={() => setIsUploadDialogOpen(true)}>
								<Plus size={14} className="mr-2" />
								슬라이드 추가하기
							</Button>
						</div>

						{/* Drag & Drop List */}
						<DragDropContext onDragEnd={handleDragEnd}>
							<Droppable droppableId="slides">
								{(provided) => (
									<div
										ref={provided.innerRef}
										{...provided.droppableProps}
										className="space-y-4"
									>
										{slides.map((slide, index) => (
											<SlideItem
												key={slide.uniqueId}
												slide={slide}
												index={index}
												onUpdate={(updated) =>
													handleUpdateSlide(index, updated)
												}
												onDelete={handleDeleteSlide}
											/>
										))}
										{provided.placeholder}
									</div>
								)}
							</Droppable>
						</DragDropContext>

						{slides.length === 0 && (
							<div className="text-center py-12 text-muted-foreground">
								슬라이드를 추가해주세요
							</div>
						)}
					</div>
				</section>

				<Separator className="my-12" />

				{/* Action Buttons */}
				<div className="flex justify-end gap-3 pt-6">
					<Button
						type="button"
						variant="destructive"
						onClick={() => setShowResetDialog(true)}
					>
						초기화하기
					</Button>
					<Button type="submit">저장하기</Button>
				</div>
			</form>

			{/* Reset Dialog */}
			<Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>슬라이드 초기화</DialogTitle>
						<DialogDescription>
							정말 슬라이드 설정을 초기화할까요? 모든 슬라이드가 삭제됩니다.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowResetDialog(false)}>
							취소
						</Button>
						<Button variant="destructive" onClick={handleReset}>
							초기화
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
