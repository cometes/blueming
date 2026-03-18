/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { Trash2, GripVertical, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";
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
import { useFileUpload } from "@/hooks/useFileUpload";
import { cn } from "@/shared/lib/utils";
import type { DdayData } from "@/features/settings/types";

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
	const [dateInput, setDateInput] = useState(dday.date?.replace(/-/g, "") || "");
	const [dateError, setDateError] = useState("");
	const { uploadFile } = useFileUpload();

	useEffect(() => {
		setDateInput(dday.date?.replace(/-/g, "") || "");
		setDateError("");
	}, [dday.date]);

	const parseYYYYMMDD = (value: string) => {
		if (value.length !== 8) return null;
		const year = Number(value.slice(0, 4));
		const month = Number(value.slice(4, 6));
		const day = Number(value.slice(6, 8));

		if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
			return null;
		}

		const parsed = new Date(year, month - 1, day);
		if (
			parsed.getFullYear() !== year ||
			parsed.getMonth() !== month - 1 ||
			parsed.getDate() !== day
		) {
			return null;
		}

		return parsed;
	};

	const handleDateInputChange = (value: string) => {
		const digits = value.replace(/\D/g, "").slice(0, 8);
		setDateInput(digits);

		if (digits.length < 8) {
			setDateError("");
			onUpdate({ date: "" });
			return;
		}

		const parsed = parseYYYYMMDD(digits);
		if (!parsed) {
			setDateError("올바른 날짜를 입력해주세요.");
			onUpdate({ date: "" });
			return;
		}

		setDateError("");
		onUpdate({ date: format(parsed, "yyyy-MM-dd") });
	};

	const handleImageUpload = async (file: File) => {
		try {
			const url = await uploadFile(file);
			onUpdate({ image: url });
			toast.success("이미지가 업로드되었습니다.");
		} catch {
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
						<div className="flex gap-4">
							<div className="flex items-center gap-2 pr-2">
								<div
									{...provided.dragHandleProps}
									className="cursor-grab active:cursor-grabbing"
								>
									<GripVertical className="text-muted-foreground" size={20} />
								</div>
								<span className="text-sm font-medium text-sub-text">
									{dday.id}
								</span>
							</div>

							<div className="w-[260px] shrink-0">
								<div className="w-full aspect-[13/8] rounded-card overflow-hidden bg-muted ring-1 ring-[var(--color-card-border)] ring-inset">
									{dday.image ? (
										<div className="relative w-full h-full">
											<img
												src={dday.image}
												alt="디데이 이미지"
												className="w-full h-full object-cover"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-white hover:bg-black/80"
												onClick={() => onUpdate({ image: "" })}
											>
												<X size={14} />
											</Button>
										</div>
									) : (
										<label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-muted/50 transition-colors">
											<ImagePlus size={28} className="text-muted-foreground mb-2" />
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
							</div>

							<div className="flex-1 min-w-0 space-y-3">
								<Input
									placeholder="디데이 제목을 입력하세요"
									value={dday.title}
									onChange={(e) => onUpdate({ title: e.target.value })}
									className="w-full"
								/>
								<div className="space-y-2">
									<Input
										value={dateInput}
										onChange={(e) => handleDateInputChange(e.target.value)}
										placeholder="20260129"
										inputMode="numeric"
										maxLength={8}
										className="w-full"
									/>
									{dateError ? (
										<p className="text-xs text-red-500">{dateError}</p>
									) : null}
								</div>
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
								<div className="flex justify-end">
									<Button
										variant="default"
										className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 backdrop-blur-card"
										style={{ transition: "all 300ms ease" }}
										size="sm"
										onClick={() => setShowDeleteDialog(true)}
									>
										<Trash2 size={14} className="mr-2" />
										삭제
									</Button>
								</div>
							</div>
						</div>
					</div>
				)}
			</Draggable>

			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>디데이 삭제</DialogTitle>
						<DialogDescription>이 디데이를 삭제할까요?</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
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
