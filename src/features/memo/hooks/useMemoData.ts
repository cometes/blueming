"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth/store";
import { fetchMemoDetail } from "@/features/memo/api/client";
import type { MemoDetail } from "@/features/memo/types";

interface UseMemoDataArgs {
	memoId: string;
	initialMemo?: MemoDetail | null;
}

/**
 * 메모 상세 데이터 fetch + 비밀번호 인증 담당.
 */
export function useMemoData({ memoId, initialMemo }: UseMemoDataArgs) {
	const { user } = useAuthStore();
	const [memo, setMemo] = useState<MemoDetail | null>(initialMemo ?? null);
	const [isLoading, setIsLoading] = useState(!initialMemo);
	const [password, setPassword] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);

	const loadDetail = useCallback(
		async (options: { password?: string } = {}) => {
			try {
				setIsLoading(true);
				const data = await fetchMemoDetail(memoId, {
					password: options.password,
					includeAuth: true,
				});
				setMemo(data);
				return data;
			} catch (error) {
				const msg =
					error instanceof Error ? error.message : "메모를 불러오지 못했습니다.";
				toast.error(msg);
				throw error;
			} finally {
				setIsLoading(false);
			}
		},
		[memoId],
	);

	useEffect(() => {
		loadDetail().catch(() => undefined);
	}, [loadDetail, user?.uid]);

	const handleVerifyPassword = useCallback(async () => {
		if (isVerifying) return;
		if (!password.trim()) {
			setPasswordError("비밀번호를 입력해주세요.");
			return;
		}
		setIsVerifying(true);
		setPasswordError("");
		try {
			await loadDetail({ password: password.trim() });
			setPassword("");
		} catch {
			setPasswordError("비밀번호가 올바르지 않습니다.");
		} finally {
			setIsVerifying(false);
		}
	}, [isVerifying, loadDetail, password]);

	return {
		memo,
		setMemo,
		isLoading,
		password,
		setPassword,
		passwordError,
		isVerifying,
		loadDetail,
		handleVerifyPassword,
		requiresPassword: memo?.requiresPassword === true,
		requiresSecretAccess: memo?.requiresSecretAccess === true,
	};
}
