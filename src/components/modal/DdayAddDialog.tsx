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
	DialogDescription,
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
	const { uploadFile } = useFileUpload();

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
			<DialogContent className="max-w-2xl w-full bg-card-bg border-card rounded-card">
				<DialogHeader>
					<DialogTitle className="text-[20px] font-semibold">
						디데이 추가하기
					</DialogTitle>
					<DialogDescription className="text-sm text-sub-text">
						디데이 정보를 입력하고 위젯 추가 여부를 선택하세요.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
					{/* Left: Image Upload */}
					<div className="w-full">
						<div className="w-full aspect-[4/3] rounded-card border-card overflow-hidden bg-card-bg">
							{thumbnail ? (
								<img
									src={thumbnail}
									alt="Preview"
									className="w-full h-full object-cover"
								/>
							) : (
								<label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-card-bg transition-colors">
									<ImagePlus size={28} className="text-sub-text mb-2" />
									<span className="text-xs text-sub-text">
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
					<div className="w-full space-y-4 min-w-0">
						<div className="space-y-2">
							<Label className="text-xs font-medium text-sub-text">
								디데이 제목
							</Label>
							<Input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="디데이 제목을 입력하세요"
								className="rounded-card border-card bg-card-bg"
							/>
						</div>

						<DatePicker
							date={date}
							onDateChange={setDate}
							label="디데이 날짜"
							placeholder="날짜를 선택하세요"
							fromYear={2000}
							toYear={new Date().getFullYear() + 10}
							buttonClassName="w-full"
						/>

						<div className="flex items-center space-x-2">
							<Checkbox
								id="add-to-widget"
								checked={addToWidget}
								onCheckedChange={(checked) =>
									setAddToWidget(checked as boolean)
								}
							/>
							<Label
								htmlFor="add-to-widget"
								className="cursor-pointer text-sm text-sub-text"
							>
								위젯에 추가
							</Label>
						</div>
					</div>
				</div>

				<DialogFooter className="gap-2 sm:gap-3">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						취소
					</Button>
					<Button onClick={handleAdd}>추가</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
