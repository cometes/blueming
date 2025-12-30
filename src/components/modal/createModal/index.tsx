"use client";

import {
	useMemo,
	useState,
	useEffect,
	type ChangeEvent,
	type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ImagePlus, X, Globe, Lock, Ban, Plus, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateSlug, normalizeSlug } from "@/lib/slug";

type Visibility = "all" | "password" | "secret";

export interface CreateMetaValue {
	tags: string[];
	series?: string;
	slug?: string;
	summary?: string;
	visibility: Visibility;
	password?: string;
	thumbnail?: string;
	title?: string;
}

interface CreateModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tagsOptions?: any[];
	seriesOptions?: any[];
	value: CreateMetaValue;
	onChange: (next: CreateMetaValue) => void;
	onConfirm: () => void;
	isSubmitting?: boolean;
}

const pickLabel = (item: any): string => {
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
	const [seriesInput, setSeriesInput] = useState("");
	const [seriesOpen, setSeriesOpen] = useState(false);
	const [seriesInputOpen, setSeriesInputOpen] = useState(false);
	const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

	const MAX_TAGS = 6;

	// 제목이 변경될 때 slug 자동 생성 (수동으로 편집하지 않은 경우에만)
	useEffect(() => {
		if (value.title && !slugManuallyEdited && open) {
			const autoSlug = generateSlug(value.title);
			if (autoSlug !== value.slug) {
				onChange({
					...value,
					slug: autoSlug,
				});
			}
		}
	}, [value.title, open]);

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
					.filter((tag) => Boolean(tag?.trim())) as string[]
			)
		);
	}, [tagsOptions]);

	const filteredTags = useMemo(() => {
		if (!tagSearchInput.trim()) return normalizedTags;
		return normalizedTags.filter((tag) =>
			tag.toLowerCase().includes(tagSearchInput.toLowerCase())
		);
	}, [normalizedTags, tagSearchInput]);

	const normalizedSeries = useMemo(() => {
		return Array.from(
			new Set(
				(seriesOptions ?? [])
					.map(pickLabel)
					.filter((series) => Boolean(series?.trim())) as string[]
			)
		);
	}, [seriesOptions]);

	const hasPasswordError =
		value.visibility === "password" && !value.password?.trim();

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
		setTagOpen(false);
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

	const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onloadend = () => {
			if (typeof reader.result === "string") {
				onChange({
					...value,
					thumbnail: reader.result,
				});
			}
		};
		reader.readAsDataURL(file);
	};

	const handleSummaryChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		const next = event.target.value.slice(0, 150);
		onChange({
			...value,
			summary: next,
		});
	};

	if (!open) return null;

	return (
		<>
			<div className="fixed inset-0 bg-black/50 z-50 animate-fade-in">
				<div className="w-full h-full flex justify-center items-center p-8">
					<div className="w-full max-w-[768px] bg-card rounded-card max-h-[90vh] flex flex-col">
						<ScrollArea className="flex-1 px-8 py-8">
							<div className="flex gap-8">
								{/* 좌측: 썸네일 + 소개 */}
								<div className="w-1/2">
									<h3 className="text-2xl font-semibold text-main-text mb-4">
										포스트 미리보기
									</h3>
									<section className="space-y-4">
										<div className="rounded-card border border-card bg-muted/20 p-4 flex flex-col items-center gap-4">
											{value.thumbnail ? (
												<div className="relative w-full aspect-video overflow-hidden rounded-card border border-card">
													<img
														src={value.thumbnail}
														alt="썸네일 미리보기"
														className="w-full h-full object-cover"
													/>
													<Button
														type="button"
														size="icon"
														variant="ghost"
														className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white"
														onClick={() =>
															onChange({
																...value,
																thumbnail: "",
															})
														}
													>
														<X size={16} />
													</Button>
												</div>
											) : (
												<label className="w-full aspect-video border border-dashed border-card text-sub-text rounded-card flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-theme-primary/60 transition-colors">
													<ImagePlus size={40} className="text-sub-text" />
													<span className="text-sm text-theme-primary">
														썸네일 업로드
													</span>
													<input
														type="file"
														accept="image/*"
														onChange={handleThumbnailChange}
														className="hidden"
													/>
												</label>
											)}
										</div>
										<div>
											<h4 className="text-xl font-semibold text-main-text overflow-ellipsis whitespace-nowrap overflow-hidden">
												{value.title || "제목을 입력해주세요"}
											</h4>
											<textarea
												value={value.summary ?? ""}
												onChange={handleSummaryChange}
												className="resize-none w-full border border-card rounded-card outline-none bg-card text-main-text placeholder:text-sub-text text-sm h-28 p-3 mt-2"
												placeholder="포스트를 짧게 소개해주세요."
											/>
											<div className="text-right mt-1 text-xs text-sub-text">
												{value.summary?.length ?? 0}/150
											</div>
										</div>
									</section>
								</div>

								{/* 구분선 */}
								<div className="w-px bg-card-border"></div>

								{/* 우측: 설정 */}
								<div className="w-1/2">
									<div className="flex flex-col justify-between h-full">
										{tagOpen ? (
											/* 태그 설정 화면 */
											<section className="space-y-6">
												<h3 className="text-2xl font-semibold text-main-text">
													태그 설정
												</h3>
												<div className="space-y-3">
													{/* 검색 입력 */}
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

													{/* 기존 태그 목록 */}
													{filteredTags.length > 0 && (
														<div className="space-y-2">
															<p className="text-xs text-sub-text px-2">
																기존 태그에서 선택 ({value.tags.length}/
																{MAX_TAGS})
															</p>
															<ScrollArea className="h-64 pr-4">
																<div className="space-y-2">
																	{filteredTags.map((tag) => {
																		const isSelected = value.tags.includes(tag);
																		const canSelect =
																			!isSelected &&
																			value.tags.length < MAX_TAGS;

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
																					"w-full text-left px-4 py-3 rounded-card border transition-colors",
																					isSelected
																						? "bg-theme-primary/10 border-theme-primary text-theme-primary"
																						: canSelect
																						? "bg-card border-card text-main-text hover:border-theme-primary/50"
																						: "bg-card border-card text-sub-text opacity-50 cursor-not-allowed"
																				)}
																			>
																				{tag}
																				{isSelected && (
																					<span className="float-right text-theme-primary">
																						✓
																					</span>
																				)}
																			</button>
																		);
																	})}
																</div>
															</ScrollArea>
														</div>
													)}

													{/* 새 태그 추가 */}
													<div className="pt-3 border-t border-card-border space-y-2">
														<p className="text-xs text-sub-text">
															새 태그 추가
														</p>
														<div className="flex gap-2">
															<Input
																type="text"
																placeholder="새 태그 입력"
																value={tagInput}
																onChange={(event) =>
																	setTagInput(event.target.value)
																}
																onKeyDown={handleTagKeyDown}
																className="bg-card border-card rounded-card"
															/>
															<Button
																type="button"
																onClick={handleAddTag}
																disabled={
																	!tagInput.trim() ||
																	value.tags.length >= MAX_TAGS
																}
															>
																추가
															</Button>
														</div>
													</div>
												</div>
											</section>
										) : seriesOpen ? (
											/* 시리즈 추가 화면 */
											<section className="space-y-6">
												<h3 className="text-2xl font-semibold text-main-text">
													시리즈 설정
												</h3>
												{seriesInputOpen ? (
													/* 새 시리즈 입력 */
													<div className="space-y-3">
														<Input
															type="text"
															placeholder="새로운 시리즈 이름을 입력하세요"
															value={seriesInput}
															onChange={(event) =>
																setSeriesInput(event.target.value)
															}
															className="bg-card border-card rounded-card"
														/>
														<div className="text-sm text-sub-text">
															/series/{seriesInput || "slug"}
														</div>
														<div className="flex justify-end gap-2">
															<Button
																type="button"
																variant="outline"
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
													/* 기존 시리즈 목록 */
													<div className="space-y-3">
														{normalizedSeries.length > 0 ? (
															<ScrollArea className="h-64 pr-4">
																<ul className="space-y-2">
																	{normalizedSeries.map((series) => (
																		<li key={series}>
																			<button
																				type="button"
																				onClick={() => {
																					onChange({
																						...value,
																						series,
																					});
																					setSeriesOpen(false);
																				}}
																				className={cn(
																					"w-full text-left px-4 py-3 rounded-card border transition-colors",
																					value.series === series
																						? "bg-theme-primary/10 border-theme-primary text-theme-primary"
																						: "bg-card border-card text-main-text hover:border-theme-primary/50"
																				)}
																			>
																				{series}
																			</button>
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
															variant="outline"
															className="w-full"
															onClick={() => setSeriesInputOpen(true)}
														>
															새 시리즈 만들기
														</Button>
													</div>
												)}
											</section>
										) : (
											/* 기본 설정 화면 */
											<section className="space-y-6">
												<div>
													<h3 className="text-2xl font-semibold text-main-text mb-4">
														공개 설정
													</h3>
													<div className="flex gap-2">
														<button
															type="button"
															onClick={() =>
																onChange({
																	...value,
																	visibility: "all",
																	password: "",
																})
															}
															className={cn(
																"flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-card cursor-pointer text-sm font-medium transition-colors",
																value.visibility === "all"
																	? "bg-theme-primary text-white border-2 border-theme-primary"
																	: "bg-card text-main-text border-2 border-card hover:border-theme-primary/50"
															)}
														>
															<Globe size={16} />
															전체 공개
														</button>
														<button
															type="button"
															onClick={() =>
																onChange({
																	...value,
																	visibility: "password",
																})
															}
															className={cn(
																"flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-card cursor-pointer text-sm font-medium transition-colors",
																value.visibility === "password"
																	? "bg-theme-primary text-white border-2 border-theme-primary"
																	: "bg-card text-main-text border-2 border-card hover:border-theme-primary/50"
															)}
														>
															<Lock size={16} />
															보호글
														</button>
														<button
															type="button"
															onClick={() =>
																onChange({
																	...value,
																	visibility: "secret",
																	password: "",
																})
															}
															className={cn(
																"flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-card cursor-pointer text-sm font-medium transition-colors",
																value.visibility === "secret"
																	? "bg-theme-primary text-white border-2 border-theme-primary"
																	: "bg-card text-main-text border-2 border-card hover:border-theme-primary/50"
															)}
														>
															<Ban size={16} />
															비공개
														</button>
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
															className={cn(
																"mt-3 bg-card border-card rounded-card",
																hasPasswordError &&
																	"border-red-400 focus-visible:ring-red-400"
															)}
														/>
													)}
													{hasPasswordError && (
														<p className="text-xs text-red-400 mt-1">
															비밀번호를 입력해주세요
														</p>
													)}
												</div>

												<div>
													<h3 className="text-2xl font-semibold text-main-text mb-4">
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
															// 포커스를 벗어날 때 정규화
															onChange({
																...value,
																slug: normalizeSlug(event.target.value),
															});
														}}
														className="bg-card border-card rounded-card"
													/>
													<p className="text-xs text-sub-text mt-2">
														/@cometes/
														{normalizeSlug(value.slug || "") ||
															"auto-generated-slug"}
													</p>
													<p className="text-xs text-theme-primary/70 mt-1">
														{!slugManuallyEdited && value.slug
															? "💡 제목을 변경하면 URL도 자동으로 변경됩니다"
															: "✏️ 직접 수정한 URL은 제목 변경 시에도 유지됩니다"}
													</p>
												</div>

												<div>
													<h3 className="text-2xl font-semibold text-main-text mb-4">
														태그 설정
													</h3>
													<div className="space-y-3">
														{/* 선택된 태그 표시 */}
														{value.tags.length > 0 ? (
															<div className="flex flex-wrap gap-2">
																{value.tags.map((tag) => (
																	<div
																		key={tag}
																		className="px-3 py-1.5 rounded-full text-xs font-medium bg-theme-primary/10 text-theme-primary border border-theme-primary/20 flex items-center gap-1.5"
																	>
																		{tag}
																		<button
																			type="button"
																			onClick={() => toggleTag(tag)}
																			className="hover:bg-theme-primary/20 rounded-full p-0.5 transition-colors"
																		>
																			<X size={12} />
																		</button>
																	</div>
																))}
															</div>
														) : (
															<p className="text-sm text-sub-text">
																태그를 추가해주세요 (최대 6개)
															</p>
														)}

														{/* 태그 추가 버튼 */}
														<button
															type="button"
															onClick={() => setTagOpen(true)}
															disabled={value.tags.length >= MAX_TAGS}
															className="w-full h-10 inline-flex items-center justify-center rounded-card bg-card cursor-pointer text-sm font-medium border-2 border-card hover:border-theme-primary/50 text-main-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
														>
															<Plus size={16} className="mr-2" />
															태그 추가 ({value.tags.length}/{MAX_TAGS})
														</button>
													</div>
												</div>

												<div>
													<h3 className="text-2xl font-semibold text-main-text mb-4">
														시리즈 설정
													</h3>
													{value.series ? (
														<div className="space-y-2">
															<div className="px-4 py-3 rounded-card bg-theme-primary/10 border border-theme-primary text-theme-primary flex justify-between items-center">
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
														<button
															type="button"
															onClick={() => setSeriesOpen(true)}
															className="w-full h-10 inline-flex items-center justify-center rounded-card bg-card cursor-pointer text-sm font-medium border-2 border-card hover:border-theme-primary/50 text-main-text transition-colors"
														>
															시리즈에 추가하기
														</button>
													)}
												</div>
											</section>
										)}

										{/* 하단 버튼 */}
										<div className="flex justify-end gap-2 mt-6 pt-6 border-t border-card-border">
											<Button
												type="button"
												variant="outline"
												onClick={() => {
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
												disabled={isSubmitting}
											>
												취소
											</Button>
											<Button
												type="button"
												onClick={() => {
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
												className="bg-theme-primary hover:bg-theme-primary/90"
												disabled={
													isSubmitting ||
													(!tagOpen && !seriesOpen && hasPasswordError)
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
							</div>
						</ScrollArea>
					</div>
				</div>
			</div>
		</>
	);
};

export default CreateModal;
