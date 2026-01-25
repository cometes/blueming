import { useState, useEffect, useCallback } from "react";

const COOLDOWN_SECONDS = 20;
const STORAGE_KEY = "commentCooldownUntil";

export const useCommentCooldown = () => {
	const [cooldownUntil, setCooldownUntil] = useState(0);
	const [cooldownRemaining, setCooldownRemaining] = useState(0);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const stored = Number(window.localStorage.getItem(STORAGE_KEY));
		if (stored && stored > Date.now()) {
			setCooldownUntil(stored);
		}
	}, []);

	useEffect(() => {
		if (!cooldownUntil) {
			setCooldownRemaining(0);
			return;
		}
		const updateRemaining = () => {
			const remaining = Math.max(
				0,
				Math.ceil((cooldownUntil - Date.now()) / 1000),
			);
			setCooldownRemaining(remaining);
			if (remaining === 0 && typeof window !== "undefined") {
				window.localStorage.removeItem(STORAGE_KEY);
			}
		};
		updateRemaining();
		const id = window.setInterval(updateRemaining, 1000);
		return () => window.clearInterval(id);
	}, [cooldownUntil]);

	const startCooldown = useCallback(() => {
		const nextCooldown = Date.now() + COOLDOWN_SECONDS * 1000;
		setCooldownUntil(nextCooldown);
		if (typeof window !== "undefined") {
			window.localStorage.setItem(STORAGE_KEY, String(nextCooldown));
		}
	}, []);

	return {
		cooldownRemaining,
		startCooldown,
	};
};
