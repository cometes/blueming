"use client";

import { useCallback, useMemo, useRef, useState } from "react";

const normalizeTag = (value: string) =>
	value.replace(/^#/, "").replace(/\s+/g, "").trim();

interface UseTagPickerArgs {
	tagsOptions: string[];
	maxTags?: number;
}

/**
 * 태그 검색·선택·직접 추가 UI의 공용 상태 훅.
 * 메모/갤러리 작성 모달이 함께 사용한다. 렌더링은 components/tag/TagPicker가 담당.
 */
export function useTagPicker({ tagsOptions, maxTags = 6 }: UseTagPickerArgs) {
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");
	const [tagSearchInput, setTagSearchInput] = useState("");
	const [tagInputOpen, setTagInputOpen] = useState(false);
	const tagJustAddedRef = useRef(false);
	const isComposingRef = useRef(false);

	const normalizedTags = useMemo(() => {
		return Array.from(
			new Set(
				tagsOptions.map((tag) => tag.trim()).filter((tag) => Boolean(tag)),
			),
		);
	}, [tagsOptions]);

	const filteredTags = useMemo(() => {
		if (!tagSearchInput.trim()) return normalizedTags;
		return normalizedTags.filter((tag) =>
			tag.toLowerCase().includes(tagSearchInput.toLowerCase()),
		);
	}, [normalizedTags, tagSearchInput]);

	const handleAddTag = (value: string) => {
		const normalized = normalizeTag(value);
		if (!normalized) return;
		if (tags.length >= maxTags) return;
		if (tags.includes(normalized)) {
			setTagInput("");
			return;
		}
		setTags((prev) => [...prev, normalized]);
		setTagInput("");
		setTagInputOpen(false);
		tagJustAddedRef.current = true;
	};

	const handleRemoveTag = (value: string) => {
		setTags((prev) => prev.filter((tag) => tag !== value));
	};

	const toggleTag = (value: string) => {
		if (!value) return;
		const isRemoving = tags.includes(value);
		if (!isRemoving && tags.length >= maxTags) return;
		setTags((prev) =>
			isRemoving ? prev.filter((tag) => tag !== value) : [...prev, value],
		);
	};

	const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			if (event.nativeEvent.isComposing || isComposingRef.current) return;
			event.preventDefault();
			handleAddTag(tagInput);
		}
	};

	const handleTagInputBlur = () => {
		if (isComposingRef.current) return;
		if (tagJustAddedRef.current) {
			tagJustAddedRef.current = false;
			setTagInput("");
			setTagInputOpen(false);
			return;
		}
		if (tagInput.trim()) {
			handleAddTag(tagInput);
			return;
		}
		setTagInput("");
		setTagInputOpen(false);
	};

	const handleTagCompositionStart = () => {
		isComposingRef.current = true;
	};

	const handleTagCompositionEnd = () => {
		isComposingRef.current = false;
	};

	const reset = useCallback(() => {
		setTags([]);
		setTagInput("");
		setTagSearchInput("");
		setTagInputOpen(false);
	}, []);

	return {
		maxTags,
		tags,
		setTags,
		tagInput,
		setTagInput,
		tagSearchInput,
		setTagSearchInput,
		tagInputOpen,
		setTagInputOpen,
		filteredTags,
		handleAddTag,
		handleRemoveTag,
		toggleTag,
		handleTagKeyDown,
		handleTagInputBlur,
		handleTagCompositionStart,
		handleTagCompositionEnd,
		reset,
	};
}

export type TagPickerState = ReturnType<typeof useTagPicker>;
