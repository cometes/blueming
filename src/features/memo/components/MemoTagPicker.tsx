"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	MAX_MEMO_TAGS,
	type MemoComposer,
} from "@/features/memo/hooks/useMemoComposer";

interface MemoTagPickerProps {
	composer: Pick<
		MemoComposer,
		| "tags"
		| "filteredTags"
		| "tagInput"
		| "setTagInput"
		| "tagSearchInput"
		| "setTagSearchInput"
		| "tagInputOpen"
		| "setTagInputOpen"
		| "handleAddTag"
		| "handleRemoveTag"
		| "toggleTag"
		| "handleTagKeyDown"
		| "handleTagInputBlur"
		| "handleTagCompositionStart"
		| "handleTagCompositionEnd"
	>;
}

/** 메모 작성 모달 우측의 태그 검색·선택·추가 패널 */
export default function MemoTagPicker({ composer }: MemoTagPickerProps) {
	const {
		tags,
		filteredTags,
		tagInput,
		setTagInput,
		tagSearchInput,
		setTagSearchInput,
		tagInputOpen,
		setTagInputOpen,
		handleRemoveTag,
		toggleTag,
		handleTagKeyDown,
		handleTagInputBlur,
		handleTagCompositionStart,
		handleTagCompositionEnd,
	} = composer;

	return (
		<div className="space-y-2">
			<label className="text-xs text-sub-text">태그</label>
			<div className="space-y-3">
				<div className="relative">
					<Search
						className="absolute left-3 top-1/2 -translate-y-1/2 text-sub-text"
						size={16}
					/>
					<Input
						type="text"
						placeholder="태그 검색..."
						value={tagSearchInput}
						onChange={(event) => setTagSearchInput(event.target.value)}
						className="pl-9 bg-card border-card rounded-card"
					/>
				</div>
				<div className="space-y-2">
					<p className="text-xs text-sub-text px-1">
						선택된 태그 ({tags.length}/{MAX_MEMO_TAGS})
					</p>
					<div className="flex flex-wrap items-center gap-2">
						{tags.map((tag) => (
							<div
								key={tag}
								className="px-3 py-1.5 rounded-full text-xs font-medium bg-theme-primary/10 text-theme-primary border border-theme-primary/20 flex items-center gap-1.5"
							>
								{tag}
								<button
									type="button"
									onClick={() => handleRemoveTag(tag)}
									className="hover:bg-theme-primary/20 rounded-full p-0.5 transition-colors"
								>
									<X size={12} />
								</button>
							</div>
						))}
						{tagInputOpen ? (
							<input
								type="text"
								value={tagInput}
								onChange={(event) => setTagInput(event.target.value)}
								onCompositionStart={handleTagCompositionStart}
								onCompositionEnd={handleTagCompositionEnd}
								onKeyDown={handleTagKeyDown}
								onBlur={handleTagInputBlur}
								autoFocus
								className="h-8 w-32 flex-none rounded-full border border-card bg-card px-3 text-xs text-main-text placeholder:text-sub-text focus-visible:outline-none focus-visible:border-theme-primary focus-visible:ring-1 focus-visible:ring-theme-primary/20"
								style={{ transition: "all 0.3s ease-in-out" }}
								placeholder="새 태그"
							/>
						) : (
							<button
								type="button"
								onClick={() => setTagInputOpen(true)}
								disabled={tags.length >= MAX_MEMO_TAGS}
								className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-card text-sub-text hover:border-theme-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								+ 태그 추가
							</button>
						)}
					</div>
				</div>

				{filteredTags.length > 0 && (
					<div className="space-y-2">
						<p className="text-xs text-sub-text px-1">
							기존 태그에서 선택 ({tags.length}/{MAX_MEMO_TAGS})
						</p>
						<ScrollArea className="h-60 pr-4">
							<div className="flex flex-wrap gap-2">
								{filteredTags.map((tag) => {
									const isSelected = tags.includes(tag);
									const canSelect = !isSelected && tags.length < MAX_MEMO_TAGS;
									return (
										<button
											key={tag}
											type="button"
											onClick={() => {
												if (isSelected || canSelect) {
													toggleTag(tag);
												}
											}}
											disabled={!isSelected && !canSelect}
											className={cn(
												"px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
												isSelected
													? "bg-theme-primary/10 border-theme-primary text-theme-primary"
													: canSelect
														? "bg-card border-card text-main-text hover:border-theme-primary/50"
														: "bg-card border-card text-sub-text opacity-50 cursor-not-allowed",
											)}
										>
											{tag}
										</button>
									);
								})}
							</div>
						</ScrollArea>
					</div>
				)}
			</div>
		</div>
	);
}
