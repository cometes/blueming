"use client";

import { useMemo, useState, useEffect, type KeyboardEvent } from "react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import CreateModalLeftPanel from "@/features/library/components/CreateModalLeftPanel";
import CreateModalRightPanel from "@/features/library/components/CreateModalRightPanel";
import { generateSlug } from "@/shared/lib/slug";
import { useSettings } from "@/contexts/SettingsContext";
import { X } from "lucide-react";

type Visibility = "all" | "password" | "secret";

export interface CreateMetaValue {
	tags: string[];
	series?: string;
	slug?: string;
	visibility: Visibility;
	password?: string;
	thumbnail?: string;
	title?: string;
	pinned?: boolean;
	backgroundType?: "default" | "color" | "image";
	backgroundColor?: string;
	backgroundImage?: string;
	enableBackdrop?: boolean;
}

interface OptionItem {
	id?: string | number;
	label?: string;
	name?: string;
	title?: string;
	series?: string;
	tag?: string;
	value?: string;
}

interface CreateModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tagsOptions?: OptionItem[];
	seriesOptions?: OptionItem[];
	value: CreateMetaValue;
	onChange: (next: CreateMetaValue) => void;
	onConfirm: () => void;
	isSubmitting?: boolean;
}

const pickLabel = (item: string | OptionItem | null | undefined): string => {
	if (typeof item === "string") return item;
	if (!item) return "";
	return (
		item.label ??
		item.name ??
		item.title ??
		item.series ??
		item.tag ??
		item.value ??
		(item.id ? String(item.id) : "")
	);
};

const CreateModal = ({
	open,
	onOpenChange,
	tagsOptions = [],
	seriesOptions = [],
	value,
	onChange,
	onConfirm,
	isSubmitting = false,
}: CreateModalProps) => {
	const [tagInput, setTagInput] = useState("");
	const [tagSearchInput, setTagSearchInput] = useState("");
	const [tagOpen, setTagOpen] = useState(false);
	const [tagInputOpen, setTagInputOpen] = useState(false);
	const [seriesInput, setSeriesInput] = useState("");
	const [seriesOpen, setSeriesOpen] = useState(false);
	const [seriesInputOpen, setSeriesInputOpen] = useState(false);
	const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
	const [passwordTouched, setPasswordTouched] = useState(false);
	const [thumbnailDialogOpen, setThumbnailDialogOpen] = useState(false);
	const [backgroundDialogOpen, setBackgroundDialogOpen] = useState(false);
	const { general } = useSettings();

	const MAX_TAGS = 6;

	// 제목이 변경될 때 slug 자동 생성 (수동으로 편집하지 않은 경우에만)
	useEffect(() => {
		if (value.title && !value.slug && !slugManuallyEdited && open) {
			const autoSlug = generateSlug(value.title);
			if (autoSlug !== value.slug) {
				onChange({
					...value,
					slug: autoSlug,
				});
			}
		}
	}, [value, open, slugManuallyEdited, onChange]);

	// 모달이 열릴 때 slug 수동 편집 상태 초기화
	useEffect(() => {
		if (open) {
			setSlugManuallyEdited(false);
		}
	}, [open]);

	const normalizedTags = useMemo(() => {
		return Array.from(
			new Set(
				(tagsOptions ?? [])
					.map(pickLabel)
					.filter((tag) => Boolean(tag?.trim())) as string[],
			),
		);
	}, [tagsOptions]);

	const filteredTags = useMemo(() => {
		if (!tagSearchInput.trim()) return normalizedTags;
		return normalizedTags.filter((tag) =>
			tag.toLowerCase().includes(tagSearchInput.toLowerCase()),
		);
	}, [normalizedTags, tagSearchInput]);

	const normalizedSeries = useMemo(() => {
		return Array.from(
			new Set(
				(seriesOptions ?? [])
					.map(pickLabel)
					.filter((series) => Boolean(series?.trim())) as string[],
			),
		);
	}, [seriesOptions]);

	const hasPasswordError =
		value.visibility === "password" && !value.password?.trim();
	const shouldShowPasswordError = hasPasswordError && passwordTouched;

	useEffect(() => {
		if (value.visibility !== "password") {
			setPasswordTouched(false);
		}
	}, [value.visibility]);

	const toggleTag = (tag: string) => {
		if (!tag) return;
		const isRemoving = value.tags.includes(tag);

		// 추가하려는데 이미 6개인 경우 차단
		if (!isRemoving && value.tags.length >= MAX_TAGS) {
			return;
		}

		onChange({
			...value,
			tags: isRemoving
				? value.tags.filter((t) => t !== tag)
				: [...value.tags, tag],
		});
	};

	const handleAddTag = () => {
		const newTag = tagInput.trim();
		if (!newTag) return;
		if (value.tags.length >= MAX_TAGS) return;
		if (!value.tags.includes(newTag)) {
			onChange({
				...value,
				tags: [...value.tags, newTag],
			});
		}
		setTagInput("");
		setTagInputOpen(false);
	};

	const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			handleAddTag();
		}
	};

	const handleAddSeries = () => {
		const newSeries = seriesInput.trim();
		if (!newSeries) return;
		onChange({
			...value,
			series: newSeries,
		});
		setSeriesInput("");
	};

	if (!open) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="w-full max-w-[95vw] md:max-w-3xl bg-card rounded-card max-h-[90vh] flex flex-col border-card backdrop-blur-card p-0"
				onInteractOutside={(event) => {
					const target = event.target as HTMLElement | null;
					if (
						target?.closest('[data-slot="popover-content"]') ||
						target?.closest(".sketch-picker")
					) {
						event.preventDefault();
					}
				}}
				onPointerDownOutside={(event) => {
					const target = event.target as HTMLElement | null;
					if (
						target?.closest('[data-slot="popover-content"]') ||
						target?.closest(".sketch-picker")
					) {
						event.preventDefault();
					}
				}}
			>
				<DialogHeader className="sr-only">
					<DialogTitle>라이브러리 글 설정</DialogTitle>
					<DialogDescription>
						제목, 태그, 썸네일, 시리즈, 공개 설정 등을 입력하세요.
					</DialogDescription>
				</DialogHeader>
				<DialogClose
					className="absolute right-4 top-4 z-[1] rounded-card border border-card bg-card-bg p-2 text-sub-text transition hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
					aria-label="닫기"
				>
					<X size={16} />
				</DialogClose>
				<ImageUploadDialog
					isOpen={thumbnailDialogOpen}
					onOpenChange={setThumbnailDialogOpen}
					thumbnail={value.thumbnail ?? ""}
					setThumbnail={(url) =>
						onChange({
							...value,
							thumbnail: url,
						})
					}
					onUpload={(url) =>
						onChange({
							...value,
							thumbnail: url,
						})
					}
				/>
				<ImageUploadDialog
					isOpen={backgroundDialogOpen}
					onOpenChange={setBackgroundDialogOpen}
					thumbnail={value.backgroundImage ?? ""}
					setThumbnail={(url) =>
						onChange({
							...value,
							backgroundType: "image",
							backgroundImage: url,
						})
					}
					onUpload={(url) =>
						onChange({
							...value,
							backgroundType: "image",
							backgroundImage: url,
						})
					}
				/>
				<div
					className="flex-1 min-h-0 overflow-y-scroll px-4 py-4 sm:px-6 md:px-8 md:py-8"
					style={{
						scrollbarColor: `${
							general?.design?.widget?.borderColor || "#ccc"
						} transparent`,
						scrollbarWidth: "thin",
					}}
				>
					<div className="flex flex-col md:flex-row gap-6 md:gap-8">
						<CreateModalLeftPanel
							value={value}
							onChange={onChange}
							onOpenThumbnailDialog={() => setThumbnailDialogOpen(true)}
							onOpenBackgroundDialog={() => setBackgroundDialogOpen(true)}
						/>

						{/* 구분선 */}
						<div className="h-px w-full md:h-auto md:w-px bg-card-border"></div>

						<CreateModalRightPanel
							tagOpen={tagOpen}
							setTagOpen={setTagOpen}
							tagSearchInput={tagSearchInput}
							setTagSearchInput={setTagSearchInput}
							tagInput={tagInput}
							setTagInput={setTagInput}
							tagInputOpen={tagInputOpen}
							setTagInputOpen={setTagInputOpen}
							seriesOpen={seriesOpen}
							setSeriesOpen={setSeriesOpen}
							seriesInputOpen={seriesInputOpen}
							setSeriesInputOpen={setSeriesInputOpen}
							seriesInput={seriesInput}
							setSeriesInput={setSeriesInput}
							normalizedSeries={normalizedSeries}
							filteredTags={filteredTags}
							value={value}
							onChange={onChange}
							onConfirm={() => {
								if (tagOpen) {
									setTagOpen(false);
									setTagSearchInput("");
									setTagInput("");
								} else if (seriesOpen) {
									setSeriesOpen(false);
									setSeriesInputOpen(false);
									setSeriesInput("");
								} else {
									onConfirm();
								}
							}}
							isSubmitting={isSubmitting}
							MAX_TAGS={MAX_TAGS}
							hasPasswordError={hasPasswordError}
							shouldShowPasswordError={shouldShowPasswordError}
							slugManuallyEdited={slugManuallyEdited}
							setSlugManuallyEdited={setSlugManuallyEdited}
							setPasswordTouched={setPasswordTouched}
							toggleTag={toggleTag}
							handleAddTag={handleAddTag}
							handleTagKeyDown={handleTagKeyDown}
							handleAddSeries={handleAddSeries}
							onCancel={() => {
								if (tagOpen) {
									setTagOpen(false);
									setTagSearchInput("");
									setTagInput("");
								} else if (seriesOpen) {
									setSeriesOpen(false);
									setSeriesInputOpen(false);
									setSeriesInput("");
								} else {
									onOpenChange(false);
								}
							}}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default CreateModal;
