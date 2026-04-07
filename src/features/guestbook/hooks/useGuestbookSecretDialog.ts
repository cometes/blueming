"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { verifyGuestbookSecret } from "@/features/guestbook/api/client";
import type { GuestbookEntry } from "@/features/guestbook/types";

interface UseGuestbookSecretDialogArgs {
	onVerified: (id: string, message: string, imageUrls: string[]) => void;
}

/**
 * 비밀글 PIN 인증 다이얼로그 상태 + 인증 로직 담당.
 */
export function useGuestbookSecretDialog({ onVerified }: UseGuestbookSecretDialogArgs) {
	const [secretDialogOpen, setSecretDialogOpen] = useState(false);
	const [secretDialogPin, setSecretDialogPin] = useState("");
	const [secretDialogEntry, setSecretDialogEntry] = useState<GuestbookEntry | null>(null);
	const [isVerifyingSecret, setIsVerifyingSecret] = useState(false);

	const openSecretDialog = useCallback((entry: GuestbookEntry) => {
		setSecretDialogEntry(entry);
		setSecretDialogPin("");
		setSecretDialogOpen(true);
	}, []);

	const closeSecretDialog = useCallback(() => {
		setSecretDialogOpen(false);
		setSecretDialogEntry(null);
		setSecretDialogPin("");
	}, []);

	const handleSecretToggle = useCallback(
		(entry: GuestbookEntry) => {
			if (entry.masked !== true) return;
			if (!entry.canViewSecret) return;
			openSecretDialog(entry);
		},
		[openSecretDialog],
	);

	const handleVerifySecret = useCallback(async () => {
		if (!secretDialogEntry || !/^\d{4}$/.test(secretDialogPin)) return;
		setIsVerifyingSecret(true);
		try {
			const data = await verifyGuestbookSecret(secretDialogEntry.id, {
				pin: secretDialogPin,
			});
			onVerified(
				secretDialogEntry.id,
				data.message ?? "",
				data.imageUrls ?? [],
			);
			closeSecretDialog();
		} catch {
			toast.error("비밀번호가 올바르지 않습니다.");
		} finally {
			setIsVerifyingSecret(false);
		}
	}, [closeSecretDialog, onVerified, secretDialogEntry, secretDialogPin]);

	return {
		secretDialogOpen,
		setSecretDialogOpen,
		secretDialogPin,
		setSecretDialogPin,
		secretDialogEntry,
		isVerifyingSecret,
		openSecretDialog,
		closeSecretDialog,
		handleSecretToggle,
		handleVerifySecret,
	};
}
