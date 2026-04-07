"use client";

import { useCallback, useState } from "react";
import { fetchGuestbookList } from "@/features/guestbook/api/client";
import type { GuestbookEntry } from "@/features/guestbook/types";

interface UseGuestbookListArgs {
	initialEntries: GuestbookEntry[];
	total: number;
	pageSize: number;
}

/**
 * 방명록 목록 조회 + 페이지네이션 담당.
 */
export function useGuestbookList({
	initialEntries,
	total,
	pageSize,
}: UseGuestbookListArgs) {
	const [entries, setEntries] = useState<GuestbookEntry[]>(initialEntries);
	const [totalCount, setTotalCount] = useState(total);
	const [currentPage, setCurrentPage] = useState(1);

	const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

	const loadPage = useCallback(async () => {
		try {
			const data = await fetchGuestbookList({
				page: currentPage,
				limit: pageSize,
			});
			setEntries(data.items);
			setTotalCount(data.total);
		} catch {
			// no-op
		}
	}, [currentPage, pageSize]);

	return {
		entries,
		setEntries,
		totalCount,
		currentPage,
		setCurrentPage,
		totalPages,
		loadPage,
	};
}
