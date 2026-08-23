"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { httpClient } from "@/shared/lib/http/client";
import { useAuthStore } from "@/store/auth/store";
import type { MentionCandidate, MentionEntry } from "@/features/mention/types";

interface MentionTextareaProps
	extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
	value: string;
	onValueChange: (value: string) => void;
	mentions: MentionEntry[];
	onMentionsChange: (mentions: MentionEntry[]) => void;
}

/** 캐럿 앞의 "@질의" 토큰 추출 (공백/줄바꿈/@ 미포함, 최대 20자) */
const activeMentionQuery = (text: string, caret: number): string | null => {
	const before = text.slice(0, caret);
	const match = before.match(/@([^\s@]{0,20})$/);
	return match ? match[1] : null;
};

/**
 * @멘션 자동완성 textarea (댓글·방명록·메모 답글 공용).
 * - 로그인 상태에서만 자동완성 동작 (검색 API가 requireAuth)
 * - 후보 목록은 textarea 바로 아래에 표시, ↑↓/Enter/Esc 키보드 지원
 * - 선택 시 "@이름 " 삽입 + mentions에 {uid, name} 추가.
 *   본문에서 "@이름"이 지워지면 mentions에서도 자동 제거된다.
 */
const MentionTextarea = React.forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
	function MentionTextarea(
		{
			value,
			onValueChange,
			mentions,
			onMentionsChange,
			className,
			onKeyDown,
			...textareaProps
		},
		forwardedRef,
	) {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);
	const assignRef = (node: HTMLTextAreaElement | null) => {
		textareaRef.current = node;
		if (typeof forwardedRef === "function") forwardedRef(node);
		else if (forwardedRef) forwardedRef.current = node;
	};
	const [candidates, setCandidates] = React.useState<MentionCandidate[]>([]);
	const [open, setOpen] = React.useState(false);
	const [activeIndex, setActiveIndex] = React.useState(0);
	const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const mentionsRef = React.useRef(mentions);
	mentionsRef.current = mentions;

	const closeList = React.useCallback(() => {
		setOpen(false);
		setCandidates([]);
		setActiveIndex(0);
	}, []);

	const search = React.useCallback(
		(query: string) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(async () => {
				try {
					const response = await httpClient.get<{ items: MentionCandidate[] }>(
						"/users/mention-search",
						{ params: { q: query } },
					);
					const items = response.data.items ?? [];
					setCandidates(items);
					setOpen(items.length > 0);
					setActiveIndex(0);
				} catch {
					closeList();
				}
			}, 250);
		},
		[closeList],
	);

	const syncMentionsWithText = React.useCallback(
		(text: string) => {
			const kept = mentionsRef.current.filter((m) =>
				text.includes(`@${m.name}`),
			);
			if (kept.length !== mentionsRef.current.length) {
				onMentionsChange(kept);
			}
		},
		[onMentionsChange],
	);

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const next = e.target.value;
		onValueChange(next);
		syncMentionsWithText(next);

		if (!isAuthenticated) return;
		const query = activeMentionQuery(next, e.target.selectionStart ?? next.length);
		if (query === null) {
			closeList();
			return;
		}
		search(query);
	};

	const selectCandidate = (candidate: MentionCandidate) => {
		const textarea = textareaRef.current;
		if (!textarea) return;
		const caret = textarea.selectionStart ?? value.length;
		const before = value.slice(0, caret).replace(/@[^\s@]{0,20}$/, "");
		const after = value.slice(caret);
		const inserted = `${before}@${candidate.displayName} `;
		onValueChange(inserted + after);
		if (!mentionsRef.current.some((m) => m.uid === candidate.uid)) {
			onMentionsChange([
				...mentionsRef.current,
				{ uid: candidate.uid, name: candidate.displayName },
			]);
		}
		closeList();
		requestAnimationFrame(() => {
			textarea.focus();
			const pos = inserted.length;
			textarea.setSelectionRange(pos, pos);
		});
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (open && candidates.length > 0) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setActiveIndex((prev) => (prev + 1) % candidates.length);
				return;
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setActiveIndex(
					(prev) => (prev - 1 + candidates.length) % candidates.length,
				);
				return;
			}
			if (e.key === "Enter" || e.key === "Tab") {
				e.preventDefault();
				selectCandidate(candidates[activeIndex]);
				return;
			}
			if (e.key === "Escape") {
				e.preventDefault();
				closeList();
				return;
			}
		}
		onKeyDown?.(e);
	};

	React.useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	return (
		<div className="relative">
			<textarea
				{...textareaProps}
				ref={assignRef}
				value={value}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				onBlur={(e) => {
					// 후보 클릭(마우스다운)보다 blur가 먼저 오므로 살짝 지연 후 닫기
					setTimeout(closeList, 150);
					textareaProps.onBlur?.(e);
				}}
				className={className}
			/>
			{open && candidates.length > 0 && (
				<ul className="absolute left-0 right-0 top-full z-40 mt-1 max-h-48 overflow-y-auto rounded-card border border-card bg-card-bg backdrop-blur-card shadow-lg">
					{candidates.map((candidate, index) => (
						<li key={candidate.uid}>
							<button
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									selectCandidate(candidate);
								}}
								className={cn(
									"flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-main-text",
									index === activeIndex
										? "bg-theme-primary/15"
										: "hover:bg-theme-primary/10",
								)}
							>
								<span className="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-card-bg border border-card flex items-center justify-center text-[10px] text-sub-text">
									{candidate.photoURL ? (
										<img
											src={candidate.photoURL}
											alt=""
											className="h-full w-full object-cover"
										/>
									) : (
										candidate.displayName.charAt(0)
									)}
								</span>
								<span className="truncate">@{candidate.displayName}</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
	},
);

export default MentionTextarea;
