"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { Trash2, GripVertical, X, ImagePlus } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DdayData } from "@/queries/set/setSettingsMainDday";

interface DdayItemProps {
	dday: DdayData;
	index: number;
	onUpdate: (updated: Partial<DdayData>) => void;
	onDelete: (id: string) => void;
}

export default function DdayItem({
	dday,
	index,
	onUpdate,
	onDelete,
}: DdayItemProps) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showImageSection, setShowImageSection] = useState(false);
	const { uploadFile } = useFileUpload();

	const handleImageUpload = async (file: File) => {
		try {
			const url = await uploadFile(file);
			onUpdate({ image: url });
			toast.success("이미지가 업로드되었습니다.");
		} catch (error) {
			toast.error("이미지 업로드에 실패했습니다.");
		}
	};

	return (
		<>
			<Draggable draggableId={dday.uniqueId} index={index}>
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
								디데이 {dday.id}
							</span>
						</div>

						<div className="space-y-4">
							{/* Title & Date */}
							<div className="flex gap-2">
								<Input
									placeholder="디데이 제목을 입력하세요"
									value={dday.title}
									onChange={(e) => onUpdate({ title: e.target.value })}
									className="flex-1"
								/>
								<DatePicker
									date={dday.date ? new Date(dday.date) : undefined}
									onDateChange={(date) =>
										onUpdate({
											date: date ? format(date, "yyyy-MM-dd") : "",
										})
									}
								/>
							</div>

							{/* Image Section */}
							<div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowImageSection(!showImageSection)}
									className="mb-2"
								>
									이미지
								</Button>
								{(showImageSection || dday.image) && (
									<div className="w-full aspect-[4/3] rounded-card border-card overflow-hidden bg-muted">
										{dday.image ? (
											<div className="relative w-full h-full">
												<img
													src={dday.image}
													alt="디데이 이미지"
													className="w-full h-full object-cover"
												/>
												<Button
													variant="destructive"
													size="icon"
													className="absolute top-2 right-2 h-6 w-6"
													onClick={() => onUpdate({ image: "" })}
												>
													<X size={14} />
												</Button>
											</div>
										) : (
											<label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-muted/50 transition-colors">
												<ImagePlus
													size={28}
													className="text-muted-foreground mb-2"
												/>
												<span className="text-xs text-muted-foreground">
													이미지 업로드
												</span>
												<input
													type="file"
													className="hidden"
													accept="image/*"
													onChange={(e) => {
														const file = e.target.files?.[0];
														if (file) handleImageUpload(file);
													}}
												/>
											</label>
										)}
									</div>
								)}
							</div>

							{/* Controls */}
							<div className="flex items-center justify-between">
								{/* Widget Checkbox */}
								<div className="flex items-center gap-2">
									<Checkbox
										checked={dday.target === "true"}
										onCheckedChange={(checked) =>
											onUpdate({ target: checked ? "true" : "false" })
										}
										id={`widget-${dday.uniqueId}`}
									/>
									<Label
										htmlFor={`widget-${dday.uniqueId}`}
										className="text-sm cursor-pointer"
									>
										위젯에 추가
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

			{/* Delete Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>디데이 삭제</DialogTitle>
						<DialogDescription>이 디데이를 삭제할까요?</DialogDescription>
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
								onDelete(dday.id);
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

