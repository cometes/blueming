"use client";

import type React from "react";
import type { CreateMetaValue } from "@/features/library/components/CreateModal";
import { Button } from "@/components/ui/button";
import CreateTagSection from "./CreateTagSection";
import CreateSeriesSection from "./CreateSeriesSection";
import CreateMetaSummarySection from "./CreateMetaSummarySection";

interface CreateModalRightPanelProps {
	tagOpen: boolean;
	setTagOpen: (open: boolean) => void;
	tagSearchInput: string;
	setTagSearchInput: (value: string) => void;
	tagInput: string;
	setTagInput: (value: string) => void;
	tagInputOpen: boolean;
	setTagInputOpen: (open: boolean) => void;
	seriesOpen: boolean;
	setSeriesOpen: (open: boolean) => void;
	seriesInputOpen: boolean;
	setSeriesInputOpen: (open: boolean) => void;
	seriesInput: string;
	setSeriesInput: (value: string) => void;
	normalizedSeries: string[];
	filteredTags: string[];
	value: CreateMetaValue;
	onChange: (next: CreateMetaValue) => void;
	onConfirm: () => void;
	isSubmitting: boolean;
	MAX_TAGS: number;
	hasPasswordError: boolean;
	shouldShowPasswordError: boolean;
	slugManuallyEdited: boolean;
	setSlugManuallyEdited: (value: boolean) => void;
	setPasswordTouched: (value: boolean) => void;
	toggleTag: (tag: string) => void;
	handleAddTag: () => void;
	handleTagKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
	handleAddSeries: () => void;
	onCancel: () => void;
}

/** 출간 모달 우측 패널: 태그 화면 / 시리즈 화면 / 기본 요약 화면 전환 + 하단 액션 */
export default function CreateModalRightPanel({
	tagOpen,
	setTagOpen,
	tagSearchInput,
	setTagSearchInput,
	tagInput,
	setTagInput,
	tagInputOpen,
	setTagInputOpen,
	seriesOpen,
	setSeriesOpen,
	seriesInputOpen,
	setSeriesInputOpen,
	seriesInput,
	setSeriesInput,
	normalizedSeries,
	filteredTags,
	value,
	onChange,
	onConfirm,
	isSubmitting,
	MAX_TAGS,
	hasPasswordError,
	shouldShowPasswordError,
	slugManuallyEdited,
	setSlugManuallyEdited,
	setPasswordTouched,
	toggleTag,
	handleAddTag,
	handleTagKeyDown,
	handleAddSeries,
	onCancel,
}: CreateModalRightPanelProps) {
	return (
		<div className="w-full md:w-1/2">
			<div className="flex flex-col justify-between h-full">
				{tagOpen ? (
					<CreateTagSection
						tags={value.tags}
						maxTags={MAX_TAGS}
						filteredTags={filteredTags}
						tagSearchInput={tagSearchInput}
						setTagSearchInput={setTagSearchInput}
						tagInput={tagInput}
						setTagInput={setTagInput}
						tagInputOpen={tagInputOpen}
						setTagInputOpen={setTagInputOpen}
						toggleTag={toggleTag}
						handleAddTag={handleAddTag}
						handleTagKeyDown={handleTagKeyDown}
					/>
				) : seriesOpen ? (
					<CreateSeriesSection
						normalizedSeries={normalizedSeries}
						selectedSeries={value.series ?? ""}
						onSelectSeries={(series) => onChange({ ...value, series })}
						seriesInputOpen={seriesInputOpen}
						setSeriesInputOpen={setSeriesInputOpen}
						seriesInput={seriesInput}
						setSeriesInput={setSeriesInput}
						handleAddSeries={handleAddSeries}
						closeSeriesPanel={() => setSeriesOpen(false)}
					/>
				) : (
					<CreateMetaSummarySection
						value={value}
						onChange={onChange}
						maxTags={MAX_TAGS}
						shouldShowPasswordError={shouldShowPasswordError}
						slugManuallyEdited={slugManuallyEdited}
						setSlugManuallyEdited={setSlugManuallyEdited}
						setPasswordTouched={setPasswordTouched}
						toggleTag={toggleTag}
						openTagPanel={() => setTagOpen(true)}
						openSeriesPanel={() => setSeriesOpen(true)}
					/>
				)}

				<div className="flex justify-end gap-2 mt-6 pt-6 border-t border-card-border">
					<Button
						type="button"
						variant="ghost"
						onClick={onCancel}
						disabled={isSubmitting}
					>
						취소
					</Button>
					<Button
						type="button"
						onClick={onConfirm}
						className="bg-theme-primary hover:bg-theme-primary/90"
						disabled={
							isSubmitting || (!tagOpen && !seriesOpen && hasPasswordError)
						}
					>
						{isSubmitting
							? "출간 중..."
							: tagOpen || seriesOpen
								? "선택 완료"
								: "출간하기"}
					</Button>
				</div>
			</div>
		</div>
	);
}
