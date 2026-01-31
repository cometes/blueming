"use client";

import type React from "react";
import type { CreateMetaValue } from "@/components/modal/createModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { normalizeSlug } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { Ban, Globe, Lock, Plus, Search, X } from "lucide-react";

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
		<div className="w-1/2">
			<div className="flex flex-col justify-between h-full">
				{tagOpen ? (
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
									onChange={(event) =>
										setTagSearchInput(event.target.value)
									}
									className="pl-9 bg-card border-card rounded-card"
								/>
							</div>
							<div className="space-y-2">
								<p className="text-xs text-sub-text px-2">
									선택된 태그 ({value.tags.length}/{MAX_TAGS})
								</p>
								<div className="flex flex-wrap items-center gap-2">
									{value.tags.map((tag) => (
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
											onChange={(event) =>
												setTagInput(event.target.value)
											}
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
											disabled={value.tags.length >= MAX_TAGS}
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
										기존 태그에서 선택 ({value.tags.length}/{MAX_TAGS})
									</p>
									<ScrollArea className="h-64 pr-4">
										<div className="flex flex-wrap gap-2">
											{filteredTags.map((tag) => {
												const isSelected = value.tags.includes(tag);
												const canSelect =
													!isSelected && value.tags.length < MAX_TAGS;

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
				) : seriesOpen ? (
					<section className="space-y-6">
						<h3 className="text-xl font-semibold text-main-text font-title">
							시리즈 설정
						</h3>
						{seriesInputOpen ? (
							<div className="space-y-3">
								<Input
									type="text"
									placeholder="새로운 시리즈 이름을 입력하세요"
									value={seriesInput}
									onChange={(event) => setSeriesInput(event.target.value)}
									className="bg-card border-card rounded-card"
								/>
								<div className="text-sm text-sub-text">
									/series/{seriesInput || "slug"}
								</div>
								<div className="flex justify-end gap-2">
									<Button
										type="button"
										variant="ghost"
										onClick={() => {
											setSeriesInputOpen(false);
											setSeriesInput("");
										}}
									>
										취소
									</Button>
									<Button
										type="button"
										onClick={() => {
											handleAddSeries();
											setSeriesInputOpen(false);
											setSeriesOpen(false);
										}}
										className="bg-theme-primary hover:bg-theme-primary/90"
									>
										시리즈 추가
									</Button>
								</div>
							</div>
						) : (
							<div className="space-y-3">
								{normalizedSeries.length > 0 ? (
									<ScrollArea className="h-64 pr-4">
										<ul className="space-y-2">
											{normalizedSeries.map((series) => (
												<li key={series}>
													<Button
														type="button"
														variant="outline"
														onClick={() => {
															onChange({
																...value,
																series,
															});
															setSeriesOpen(false);
														}}
														className={cn(
															"w-full text-left px-3 py-2 rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10",
															value.series === series
																? "bg-theme-primary/10 border-theme-primary text-theme-primary"
																: "border border-card"
														)}
														style={{ transition: "all 0.3s ease-in-out" }}
													>
														{series}
													</Button>
												</li>
											))}
										</ul>
									</ScrollArea>
								) : (
									<p className="text-sm text-sub-text">
										등록된 시리즈가 없습니다.
									</p>
								)}
								<Button
									type="button"
									variant="default"
									className="w-full"
									onClick={() => setSeriesInputOpen(true)}
								>
									새 시리즈 만들기
								</Button>
							</div>
						)}
					</section>
				) : (
					<section className="space-y-6">
						<div>
							<h3 className="text-xl font-semibold text-main-text mb-4 font-title">
								공개 설정
							</h3>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										onChange({
											...value,
											visibility: "all",
											password: "",
										})
									}
									className={cn(
										"flex-1 h-10 rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10",
										value.visibility === "all"
											? "bg-theme-primary text-white border-2 border-theme-primary"
											: "border-2 border-card"
									)}
									style={{ transition: "all 0.3s ease-in-out" }}
								>
									<Globe size={16} />
									전체 공개
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										onChange({
											...value,
											visibility: "password",
										})
									}
									className={cn(
										"flex-1 h-10 rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10",
										value.visibility === "password"
											? "bg-theme-primary text-white border-2 border-theme-primary"
											: "border-2 border-card"
									)}
									style={{ transition: "all 0.3s ease-in-out" }}
								>
									<Lock size={16} />
									보호글
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										onChange({
											...value,
											visibility: "secret",
											password: "",
										})
									}
									className={cn(
										"flex-1 h-10 rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10",
										value.visibility === "secret"
											? "bg-theme-primary text-white border-2 border-theme-primary"
											: "border-2 border-card"
									)}
									style={{ transition: "all 0.3s ease-in-out" }}
								>
									<Ban size={16} />
									비공개
								</Button>
							</div>
							{value.visibility === "password" && (
								<Input
									type="password"
									placeholder="비밀번호를 입력하세요"
									value={value.password ?? ""}
									onChange={(event) =>
										onChange({
											...value,
											password: event.target.value,
										})
									}
									onBlur={() => setPasswordTouched(true)}
									className={cn(
										"mt-3 bg-card border-card rounded-card",
										shouldShowPasswordError &&
											"border-red-400 focus-visible:ring-red-400"
									)}
								/>
							)}
							{shouldShowPasswordError && (
								<p className="text-xs text-red-400 mt-1">
									비밀번호를 입력해주세요
								</p>
							)}
						</div>

						<div>
							<h3 className="text-xl font-semibold text-main-text mb-4 font-title">
								URL 설정
							</h3>
							<Input
								type="text"
								placeholder="제목 기반으로 자동 생성됩니다"
								value={value.slug ?? ""}
								onChange={(event) => {
									setSlugManuallyEdited(true);
									onChange({
										...value,
										slug: event.target.value,
									});
								}}
								onBlur={(event) => {
									onChange({
										...value,
										slug: normalizeSlug(event.target.value),
									});
								}}
								className="bg-card border-card rounded-card"
							/>
							<p className="text-xs text-sub-text mt-2">
								/@cometes/
								{normalizeSlug(value.slug || "") || "auto-generated-slug"}
							</p>
							<p className="text-xs text-theme-primary/70 mt-1">
								{!slugManuallyEdited && value.slug
									? "💡 제목을 변경하면 URL도 자동으로 변경됩니다"
									: "✏️ 직접 수정한 URL은 제목 변경 시에도 유지됩니다"}
							</p>
						</div>

						<div>
							<h3 className="text-xl font-semibold text-main-text mb-4 font-title">
								태그 설정
							</h3>
							<div className="space-y-3">
								{value.tags.length > 0 ? (
									<div className="flex flex-wrap gap-2">
										{value.tags.map((tag) => (
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
									</div>
								) : (
									<p className="text-sm text-sub-text">
										태그를 추가해주세요 (최대 6개)
									</p>
								)}

								<Button
									type="button"
									variant="outline"
									onClick={() => setTagOpen(true)}
									disabled={value.tags.length >= MAX_TAGS}
									className="w-full h-10 rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
									style={{ transition: "all 0.3s ease-in-out" }}
								>
									<Plus size={16} className="mr-2" />
									태그 추가 ({value.tags.length}/{MAX_TAGS})
								</Button>
							</div>
						</div>

						<div>
							<h3 className="text-xl font-semibold text-main-text mb-4 font-title">
								시리즈 설정
							</h3>
							{value.series ? (
								<div className="space-y-2">
									<div className="px-3 py-2 rounded-card bg-theme-primary/10 border border-theme-primary text-theme-primary flex justify-between items-center">
										<strong>{value.series}</strong>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() =>
												onChange({
													...value,
													series: "",
												})
											}
											className="text-theme-primary hover:bg-theme-primary/20 h-8 w-8"
										>
											<X size={16} />
										</Button>
									</div>
								</div>
							) : (
								<Button
									type="button"
									variant="outline"
									onClick={() => setSeriesOpen(true)}
									className="w-full h-10 rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
									style={{ transition: "all 0.3s ease-in-out" }}
								>
									시리즈에 추가하기
								</Button>
							)}
						</div>
					</section>
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
						disabled={isSubmitting || (!tagOpen && !seriesOpen && hasPasswordError)}
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
