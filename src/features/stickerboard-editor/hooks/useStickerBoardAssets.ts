"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth/store";
import {
	listStickerAssets,
	markStickerAssetUsed,
} from "@/features/stickerboard-editor/api/assets";
import type { StickerAsset, StickerAssetTab } from "@/features/stickerboard-editor/types";

export function useStickerBoardAssets(initialTab: StickerAssetTab = "all") {
	const { isAuthenticated, isLoading: authLoading } = useAuthStore();
	const [assetTab, setAssetTab] = useState<StickerAssetTab>(initialTab);
	const [assets, setAssets] = useState<StickerAsset[]>([]);
	const [assetsLoading, setAssetsLoading] = useState(false);
	const [assetsError, setAssetsError] = useState<string | null>(null);
	const [authReady, setAuthReady] = useState(false);

	const refreshAssets = useCallback(
		async (tab: StickerAssetTab = assetTab) => {
			setAssetsLoading(true);
			setAssetsError(null);
			try {
				if (!isAuthenticated) {
					if (!authReady) {
						setAssetsLoading(false);
						return;
					}
					throw new Error("로그인이 필요합니다.");
				}
				const list = await listStickerAssets(tab);
				setAssets(list.filter((asset) => asset.url));
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "에셋을 불러오지 못했습니다.";
				setAssets([]);
				setAssetsError(message);
			} finally {
				setAssetsLoading(false);
			}
		},
		[assetTab, authReady, isAuthenticated],
	);

	const markAssetUsed = useCallback(
		async (assetId: string) => {
			setAssets((prev) =>
				prev.map((asset) =>
					asset.id === assetId
						? { ...asset, lastUsedAtMs: Date.now() }
						: asset,
				),
			);
			await markStickerAssetUsed(assetId);
			if (assetTab === "recent") {
				await refreshAssets("recent");
			}
		},
		[assetTab, refreshAssets],
	);

	useEffect(() => {
		if (!authLoading) {
			setAuthReady(true);
		}
	}, [authLoading]);

	useEffect(() => {
		if (!authReady || !isAuthenticated) return;
		void refreshAssets(assetTab);
	}, [assetTab, authReady, isAuthenticated, refreshAssets]);

	return {
		state: {
			assetTab,
			assets,
			assetsLoading,
			assetsError,
			authReady,
		},
		actions: {
			setAssetTab,
			setAssets,
			setAssetsLoading,
			setAssetsError,
			refreshAssets,
			markAssetUsed,
		},
	};
}
