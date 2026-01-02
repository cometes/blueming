"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "sonner";
import type { DdayData } from "@/queries/set/setSettingsMainDday";

interface DdayAddDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onAdd: (ddayData: Omit<DdayData, "id" | "uniqueId">) => void;
}

export default function DdayAddDialog({
	isOpen,
	onOpenChange,
	onAdd,
}: DdayAddDialogProps) {
	const [thumbnail, setThumbnail] = useState("");
	const [title, setTitle] = useState("");
	const [date, setDate] = useState<Date>();
	const [addToWidget, setAddToWidget] = useState(false);
	const { uploadFile, state } = useFileUpload();

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			const url = await uploadFile(file);
			setThumbnail(url);
			toast.success("이미지가 업로드되었습니다.");
		} catch (error) {
			toast.error("이미지 업로드에 실패했습니다.");
		}
	};

	const handleAdd = () => {
		if (!title || !date || !thumbnail) {
			toast.error("모든 필드를 입력해주세요.");
			return;
		}

		onAdd({
			title,
			date: format(date, "yyyy-MM-dd"),
			image: thumbnail,
			target: addToWidget ? "true" : "false",
		});

		// Reset
		setThumbnail("");
		setTitle("");
		setDate(undefined);
		setAddToWidget(false);
		onOpenChange(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>디데이 추가하기</DialogTitle>
				</DialogHeader>

				<div className="flex gap-4">
					{/* Left: Image Upload */}
					<div className="w-60 shrink-0">
						<div className="w-full aspect-[4/3] rounded-card border-card overflow-hidden bg-muted">
							{thumbnail ? (
								<img
									src={thumbnail}
									alt="Preview"
									className="w-full h-full object-cover"
								/>
							) : (
								<label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-muted/50 transition-colors">
									<ImagePlus size={28} className="text-muted-foreground mb-2" />
									<span className="text-xs text-muted-foreground">
										Upload Image
									</span>
									<input
										type="file"
										className="hidden"
										accept="image/*"
										onChange={handleImageUpload}
									/>
								</label>
							)}
						</div>
					</div>

					{/* Right: Form */}
					<div className="flex-1 space-y-4">
						<div className="space-y-2">
							<Label>디데이 제목</Label>
							<Input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="디데이 제목을 입력하세요"
							/>
						</div>

						<div className="space-y-2">
							<DatePicker
								date={date}
								onDateChange={setDate}
								label="디데이 날짜"
								placeholder="날짜를 선택하세요"
								fromYear={2000}
								toYear={new Date().getFullYear() + 10}
							/>
						</div>

						<div className="flex items-center space-x-2">
							<Checkbox
								id="add-to-widget"
								checked={addToWidget}
								onCheckedChange={(checked) =>
									setAddToWidget(checked as boolean)
								}
							/>
							<Label htmlFor="add-to-widget" className="cursor-pointer">
								위젯에 추가
							</Label>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						취소
					</Button>
					<Button onClick={handleAdd}>추가</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
