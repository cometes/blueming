"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import { Search, X } from "lucide-react";

interface CreateTagSectionProps {
	tags: string[];
	maxTags: number;
	filteredTags: string[];
	tagSearchInput: string;
	setTagSearchInput: (value: string) => void;
	tagInput: string;
	setTagInput: (value: string) => void;
	tagInputOpen: boolean;
	setTagInputOpen: (open: boolean) => void;
	toggleTag: (tag: string) => void;
	handleAddTag: () => void;
	handleTagKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

/** 라이브러리 출간 모달 우측의 태그 검색·선택·추가 화면 */
export default function CreateTagSection({
	tags,
	maxTags,
	filteredTags,
	tagSearchInput,
	setTagSearchInput,
	tagInput,
	setTagInput,
	tagInputOpen,
	setTagInputOpen,
	toggleTag,
	handleAddTag,
	handleTagKeyDown,
}: CreateTagSectionProps) {
	return (
		<section className="space-y-6">
			<h3 className="text-xl font-semibold text-main-text font-title">
				태그 설정
			</h3>
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
					<p className="text-xs text-sub-text px-2">
						선택된 태그 ({tags.length}/{maxTags})
					</p>
					<div className="flex flex-wrap items-center gap-2">
						{tags.map((tag) => (
							<div
								key={tag}
								className="px-3 py-1.5 rounded-full text-xs font-medium bg-theme-primary/10 text-theme-primary border border-theme-primary/20 flex items-center gap-1.5"
							>
								{tag}
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => toggleTag(tag)}
									className="h-5 w-5 rounded-full hover:bg-theme-primary/20"
								>
									<X size={12} />
								</Button>
							</div>
						))}
						{tagInputOpen ? (
							<Input
								type="text"
								value={tagInput}
								onChange={(event) => setTagInput(event.target.value)}
								onKeyDown={handleTagKeyDown}
								onBlur={() => {
									if (tagInput.trim()) {
										handleAddTag();
										return;
									}
									setTagInput("");
									setTagInputOpen(false);
								}}
								autoFocus
								className="h-8 w-32 flex-none rounded-full border border-card bg-card px-3 text-xs text-main-text placeholder:text-sub-text focus-visible:outline-none focus-visible:border-theme-primary focus-visible:ring-1 focus-visible:ring-theme-primary/20"
								style={{ transition: "all 0.3s ease-in-out" }}
								placeholder="새 태그"
							/>
						) : (
							<Button
								type="button"
								variant="outline"
								onClick={() => setTagInputOpen(true)}
								disabled={tags.length >= maxTags}
								className="px-3 py-1.5 rounded-full text-xs font-medium border-dashed border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
								style={{ transition: "all 0.3s ease-in-out" }}
							>
								+ 태그 추가
							</Button>
						)}
					</div>
				</div>

				{filteredTags.length > 0 && (
					<div className="space-y-2">
						<p className="text-xs text-sub-text px-2">
							기존 태그에서 선택 ({tags.length}/{maxTags})
						</p>
						<ScrollArea className="h-64 pr-4">
							<div className="flex flex-wrap gap-2">
								{filteredTags.map((tag) => {
									const isSelected = tags.includes(tag);
									const canSelect = !isSelected && tags.length < maxTags;

									return (
										<Button
											key={tag}
											type="button"
											onClick={() => {
												if (isSelected || canSelect) {
													toggleTag(tag);
												}
											}}
											disabled={!isSelected && !canSelect}
											variant="outline"
											className={cn(
												"px-3 py-1.5 rounded-full border text-xs font-medium border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10",
												isSelected
													? "bg-theme-primary/10 border-theme-primary text-theme-primary"
													: canSelect
														? "bg-card border-card text-main-text hover:border-theme-primary/50"
														: "bg-card border-card text-sub-text opacity-50 cursor-not-allowed"
											)}
											style={{ transition: "all 0.3s ease-in-out" }}
										>
											{tag}
										</Button>
									);
								})}
							</div>
						</ScrollArea>
					</div>
				)}
			</div>
		</section>
	);
}
