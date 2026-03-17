import { useState, useEffect, useMemo } from "react";
import { listStickerAssets } from "@/features/stickerboard-editor/api/assets";
import type { StickerAsset } from "@/features/stickerboard-editor/model";

export const useAssets = (enabled: boolean) => {
	const [assets, setAssets] = useState<StickerAsset[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [hasLoaded, setHasLoaded] = useState(false);

	useEffect(() => {
		if (!enabled || hasLoaded) return;

		const loadAssets = async () => {
			try {
				setLoading(true);
				setError(null);
				const list = await listStickerAssets("all");
				setAssets(list.filter((asset) => asset.url));
				setHasLoaded(true);
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "에셋을 불러오지 못했습니다.";
				setError(message);
			} finally {
				setLoading(false);
			}
		};

		void loadAssets();
	}, [enabled, hasLoaded]);

	const filteredAssets = useMemo(() => {
		if (!searchQuery.trim()) return assets;
		const query = searchQuery.trim().toLowerCase();
		return assets.filter((asset) =>
			(asset.name || asset.url || "").toLowerCase().includes(query),
		);
	}, [assets, searchQuery]);

	return {
		assets: filteredAssets,
		loading,
		error,
		searchQuery,
		setSearchQuery,
	};
};
