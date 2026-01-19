/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
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
	const [pendingImage, setPendingImage] = useState<{
		file: File;
		previewUrl: string;
	} | null>(null);
	const [title, setTitle] = useState("");
	const [date, setDate] = useState<Date>();
	const [dateInput, setDateInput] = useState("");
	const [dateError, setDateError] = useState("");
	const [addToWidget, setAddToWidget] = useState(false);
	const { uploadFile, state: uploadState } = useFileUpload();

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
			setDate(undefined);
			setDateError("");
			return;
		}

		const parsed = parseYYYYMMDD(digits);
		if (!parsed) {
			setDate(undefined);
			setDateError("올바른 날짜를 입력해주세요.");
			return;
		}

		setDate(parsed);
		setDateError("");
	};

	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (pendingImage) {
			URL.revokeObjectURL(pendingImage.previewUrl);
		}
		const previewUrl = URL.createObjectURL(file);
		setPendingImage({ file, previewUrl });
		setThumbnail(previewUrl);
		e.target.value = "";
	};

	const handleAdd = async () => {
		if (!title || !date || !thumbnail) {
			toast.error("모든 필드를 입력해주세요.");
			return;
		}

		if (!pendingImage) {
			toast.error("이미지를 업로드해주세요.");
			return;
		}

		try {
			const uploadedUrl = await uploadFile(pendingImage.file);
			onAdd({
				title,
				date: format(date, "yyyy-MM-dd"),
				image: uploadedUrl,
				target: addToWidget ? "true" : "false",
			});

			URL.revokeObjectURL(pendingImage.previewUrl);
			setPendingImage(null);
			setThumbnail("");
			setTitle("");
			setDate(undefined);
			setDateInput("");
			setDateError("");
			setAddToWidget(false);
			onOpenChange(false);
		} catch {
			toast.error("이미지 업로드에 실패했습니다.");
		}

	};

	useEffect(() => {
		if (!isOpen) {
			if (pendingImage) {
				URL.revokeObjectURL(pendingImage.previewUrl);
			}
			setPendingImage(null);
			setThumbnail("");
			setTitle("");
			setDate(undefined);
			setDateInput("");
			setDateError("");
			setAddToWidget(false);
		}
	}, [isOpen, pendingImage]);

	useEffect(() => {
		return () => {
			if (pendingImage) {
				URL.revokeObjectURL(pendingImage.previewUrl);
			}
		};
	}, [pendingImage]);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-2xl w-full bg-card-bg border-card rounded-card backdrop-blur-card"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
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
									<span className="text-xs text-sub-text">Upload Image</span>
									<input
										type="file"
										className="hidden"
										accept="image/*"
										onChange={handleImageSelect}
										disabled={uploadState.loading}
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

						<div className="space-y-2">
							<Label className="text-xs font-medium text-sub-text">
								디데이 날짜
							</Label>
							<Input
								value={dateInput}
								onChange={(e) => handleDateInputChange(e.target.value)}
								placeholder="20260129"
								inputMode="numeric"
								maxLength={8}
								className="rounded-card border-card bg-card-bg"
							/>
							{date ? (
								<p className="text-xs text-sub-text">
									변환됨: {format(date, "yyyy-MM-dd")}
								</p>
							) : null}
							{dateError ? (
								<p className="text-xs text-red-500">{dateError}</p>
							) : null}
						</div>

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
					<Button onClick={handleAdd} disabled={uploadState.loading}>
						추가
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
