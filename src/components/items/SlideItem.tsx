"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { SlideData } from "@/queries/set/setSettngMainSlide";

interface SlideItemProps {
	slide: SlideData;
	index: number;
	onUpdate: (updated: Partial<SlideData>) => void;
	onDelete: (id: string) => void;
}

export default function SlideItem({
	slide,
	index,
	onUpdate,
	onDelete,
}: SlideItemProps) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	return (
		<>
			<Draggable draggableId={slide.uniqueId} index={index}>
				{(provided, snapshot) => (
					<div
						ref={provided.innerRef}
						{...provided.draggableProps}
						className={cn(
							"rounded-card border-card bg-card-bg p-4 shadow-sm transition-all",
							snapshot.isDragging && "shadow-lg opacity-90"
						)}
					>
						{/* Drag Handle */}
						<div
							{...provided.dragHandleProps}
							className="flex items-center gap-2 mb-3 cursor-grab active:cursor-grabbing"
						>
							<GripVertical className="text-muted-foreground" size={20} />
							<span className="text-sm font-medium text-sub-text">
								슬라이드 {slide.id}
							</span>
						</div>

						<div className="space-y-4">
							{/* URL Input */}
							<Input
								placeholder="url을 입력하세요 (선택)"
								value={slide.url}
								onChange={(e) => onUpdate({ url: e.target.value })}
								className="rounded-card border-card bg-card-bg"
							/>

							{/* Image Preview */}
							<div className="w-full aspect-video rounded-card border-card overflow-hidden bg-muted">
								<img
									src={slide.image}
									alt={`슬라이드 ${slide.id}`}
									className="w-full h-full object-contain"
								/>
							</div>

							{/* Controls */}
							<div className="flex items-center justify-between">
								{/* New Tab Checkbox */}
								<div className="flex items-center gap-2">
									<Checkbox
										checked={slide.target}
										onCheckedChange={(checked) =>
											onUpdate({ target: checked as boolean })
										}
										id={`target-${slide.uniqueId}`}
									/>
									<Label
										htmlFor={`target-${slide.uniqueId}`}
										className="text-sm cursor-pointer"
									>
										새 탭에서 열기
									</Label>
								</div>

								{/* Delete Button */}
								<Button
									variant="destructive"
									size="sm"
									onClick={() => setShowDeleteDialog(true)}
								>
									<Trash2 size={14} className="mr-2" />
									삭제
								</Button>
							</div>
						</div>
					</div>
				)}
			</Draggable>

			{/* Delete Confirmation Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>슬라이드 삭제</DialogTitle>
						<DialogDescription>이 슬라이드를 삭제할까요?</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDeleteDialog(false)}
						>
							취소
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								onDelete(slide.id);
								setShowDeleteDialog(false);
							}}
						>
							삭제
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

