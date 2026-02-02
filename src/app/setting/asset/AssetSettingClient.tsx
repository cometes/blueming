/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Save, Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	createStickerAssetFromFile,
	deleteStickerAsset,
	listStickerAssets,
	setStickerAssetFavorite,
} from "@/queries/stickerAssets";
import type { StickerAsset } from "@/types/stickerBoard";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { useSettingStatus } from "@/hooks/useSettingStatus";

export default function AssetSettingClient() {
	const [assets, setAssets] = useState<StickerAsset[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pendingUploads, setPendingUploads] = useState<
		Array<{ file: File; previewUrl: string }>
	>([]);
	const [pendingDeletes, setPendingDeletes] = useState<StickerAsset[]>([]);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const hasPendingUploads = pendingUploads.length > 0;
	const hasPendingDeletes = pendingDeletes.length > 0;
	const hasPendingChanges = hasPendingUploads || hasPendingDeletes;
	const pendingDeleteIds = useMemo(
		() => new Set(pendingDeletes.map((asset) => asset.id)),
		[pendingDeletes]
	);
	const visibleAssets = useMemo(
		() => assets.filter((asset) => !pendingDeleteIds.has(asset.id)),
		[assets, pendingDeleteIds]
	);
	const hasSelected = selectedIds.size > 0;
	const isAllSelected =
		visibleAssets.length > 0 && selectedIds.size === visibleAssets.length;
	const isDirty = useMemo(() => hasPendingChanges, [hasPendingChanges]);

	useSettingStatus("asset", isDirty ? "dirty" : "saved");
	useSettingHeaderAction(
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={() => void handleSave()}
			disabled={!hasPendingChanges || loading}
			aria-label="저장하기"
			title="저장하기"
			className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
			style={{ transition: "all 0.3s ease-in-out" }}
		>
			<Save size={16} />
		</Button>,
		[hasPendingChanges, loading]
	);

	const refreshAssets = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const list = await listStickerAssets("all");
			setAssets(list);
		} catch (err) {
			const msg =
				err instanceof Error ? err.message : "에셋을 불러오지 못했습니다.";
			setError(msg);
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refreshAssets();
	}, [refreshAssets]);

	useEffect(() => {
		setSelectedIds((prev) => {
			if (prev.size === 0) return prev;
			const idSet = new Set(visibleAssets.map((asset) => asset.id));
			const next = new Set([...prev].filter((id) => idSet.has(id)));
			return next.size === prev.size ? prev : next;
		});
	}, [visibleAssets]);

	const handleUpload = (files: File[]) => {
		const next = files.map((file) => ({
			file,
			previewUrl: URL.createObjectURL(file),
		}));
		setPendingUploads((prev) => [...prev, ...next]);
	};

	const queueDelete = (targets: StickerAsset[]) => {
		if (targets.length === 0) return;
		setPendingDeletes((prev) => {
			const map = new Map(prev.map((asset) => [asset.id, asset]));
			for (const asset of targets) {
				if (!map.has(asset.id)) {
					map.set(asset.id, asset);
				}
			}
			return Array.from(map.values());
		});
		setSelectedIds((prev) => {
			if (prev.size === 0) return prev;
			const next = new Set(prev);
			targets.forEach((asset) => next.delete(asset.id));
			return next;
		});
	};

	const handleDelete = (asset: StickerAsset) => {
		queueDelete([asset]);
	};

	const handleRestorePendingDelete = (id: string) => {
		setPendingDeletes((prev) => prev.filter((asset) => asset.id !== id));
	};

	const toggleSelectAsset = (id: string, checked: boolean) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (checked) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	};

	const toggleSelectAll = () => {
		setSelectedIds((prev) => {
			if (visibleAssets.length === 0) return prev;
			if (prev.size === visibleAssets.length) {
				return new Set();
			}
			return new Set(visibleAssets.map((asset) => asset.id));
		});
	};

	const handleDeleteSelected = () => {
		if (selectedIds.size === 0) return;
		const targets = assets.filter((asset) => selectedIds.has(asset.id));
		queueDelete(targets);
	};

	const handleRemovePending = (index: number) => {
		setPendingUploads((prev) => {
			const next = [...prev];
			const target = next[index];
			if (target) {
				URL.revokeObjectURL(target.previewUrl);
			}
			next.splice(index, 1);
			return next;
		});
	};

	const handleToggleFavorite = async (asset: StickerAsset) => {
		const nextFavorite = asset.favorite !== true;
		try {
			setAssets((prev) =>
				prev.map((item) =>
					item.id === asset.id ? { ...item, favorite: nextFavorite } : item
				)
			);
			await setStickerAssetFavorite(asset.id, nextFavorite);
		} catch (err) {
			const msg =
				err instanceof Error ? err.message : "즐겨찾기 변경에 실패했습니다.";
			toast.error(msg);
			await refreshAssets();
		}
	};

	const handleSave = async () => {
		if (!hasPendingChanges) return;
		try {
			setLoading(true);
			setError(null);
			if (pendingUploads.length > 0) {
				for (const pending of pendingUploads) {
					await createStickerAssetFromFile(pending.file);
					URL.revokeObjectURL(pending.previewUrl);
				}
				setPendingUploads([]);
			}
			if (pendingDeletes.length > 0) {
				for (const asset of pendingDeletes) {
					await deleteStickerAsset({
						id: asset.id,
						storagePath: asset.storagePath,
					});
				}
				setPendingDeletes([]);
			}
			await refreshAssets();
			toast.success("에셋이 저장되었습니다.");
		} catch (err) {
			const msg =
				err instanceof Error ? err.message : "에셋 저장에 실패했습니다.";
			setError(msg);
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		return () => {
			pendingUploads.forEach((pending) => {
				URL.revokeObjectURL(pending.previewUrl);
			});
		};
	}, [pendingUploads]);

	return (
		<section className="space-y-6">
			<div>
				<h2 className="text-[20px] font-semibold font-title">에셋 관리</h2>
				<p className="text-sm text-sub-text mt-2">
					스티커보드에서 사용하는 이미지 에셋을 관리합니다.
				</p>
			</div>

			<div className="flex items-center justify-between gap-2">
				<div className="text-xs text-sub-text">
					등록 {visibleAssets.length}개
					{hasPendingUploads ? ` · 대기 ${pendingUploads.length}개` : ""}
					{hasPendingDeletes ? ` · 삭제 대기 ${pendingDeletes.length}개` : ""}
				</div>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={toggleSelectAll}
						disabled={assets.length === 0}
						className="rounded-md border border-card bg-card-bg px-3 py-2 text-xs text-sub-text hover:border-card-active"
					>
						{isAllSelected ? "전체 해제" : "전체 선택"}
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => void handleDeleteSelected()}
						disabled={!hasSelected || loading}
						className="rounded-md border border-card bg-card-bg px-3 py-2 text-xs text-sub-text hover:border-card-active hover:text-destructive"
					>
						선택 삭제
					</Button>
					<label className="inline-flex items-center gap-2 rounded-md border border-card bg-card-bg px-3 py-2 text-xs text-sub-text hover:border-card-active cursor-pointer">
						<Upload className="h-4 w-4" />
						에셋 업로드
						<input
							type="file"
							accept="image/*"
							multiple
							className="hidden"
							onChange={(event) => {
								const fileList = event.target.files;
								if (fileList && fileList.length > 0) {
									const files = Array.from(fileList);
									handleUpload(files);
								}
								event.target.value = "";
							}}
						/>
					</label>
				</div>
			</div>

			{pendingUploads.length > 0 ? (
				<div className="rounded-card border border-card bg-card-bg/60 p-3">
					<div className="text-[11px] font-medium text-sub-text mb-2">
						업로드 대기
					</div>
					<div className="flex flex-wrap gap-2">
						{pendingUploads.map((pending, index) => (
							<div
								key={`${pending.previewUrl}-${index}`}
								className="rounded-card border border-card bg-card-bg/60 overflow-hidden max-w-20 relative"
							>
								<div className="aspect-square bg-card-bg ">
									<img
										src={pending.previewUrl}
										alt="pending asset"
										className="w-full h-full object-contain"
									/>
								</div>
								<div className="flex items-center justify-end absolute bottom-0 right-0">
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => handleRemovePending(index)}
										className="h-8 w-8 text-sub-text hover:text-destructive"
										aria-label="대기 에셋 제거"
									>
										<Trash2 size={14} />
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>
			) : null}

			{pendingDeletes.length > 0 ? (
				<div className="rounded-card border border-card bg-card-bg/60 p-3">
					<div className="text-[11px] font-medium text-sub-text mb-2">
						삭제 대기
					</div>
					<div className="flex flex-wrap gap-2">
						{pendingDeletes.map((asset) => (
							<div
								key={asset.id}
								className="rounded-card border border-card bg-card-bg/60 overflow-hidden max-w-20 relative"
							>
								<div className="aspect-square bg-card-bg ">
									<img
										src={asset.url}
										alt={asset.name ?? "pending delete"}
										className="w-full h-full object-contain"
									/>
								</div>
								<div className="flex items-center justify-end absolute bottom-0 right-0">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => handleRestorePendingDelete(asset.id)}
										className="h-8 px-2 text-[11px] text-sub-text hover:text-theme-primary"
									>
										복구
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>
			) : null}

			{loading ? (
				<div className="py-8 text-center text-sm text-sub-text">
					불러오는 중...
				</div>
			) : error ? (
				<div className="py-4 text-sm text-red-500">{error}</div>
			) : visibleAssets.length === 0 ? (
				<div className="py-8 text-center text-sm text-sub-text">
					에셋이 없습니다.
				</div>
			) : (
				<div
					className="grid gap-1.5"
					style={{
						gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
					}}
				>
					{visibleAssets.map((asset) => (
						<div
							key={asset.id}
							className="rounded-card border border-card bg-card-bg/60 backdrop-blur-card overflow-hidden relative"
						>
							<Checkbox
								checked={selectedIds.has(asset.id)}
								onCheckedChange={(checked) =>
									toggleSelectAsset(asset.id, checked === true)
								}
								aria-label="에셋 선택"
								className="absolute left-2 top-2 z-10 bg-card-bg border-card"
							/>
							<div className="aspect-square bg-card-bg">
								<img
									src={asset.url}
									alt={asset.name ?? "asset"}
									className="w-full h-full object-contain"
								/>
							</div>
							<div className="px-3 py-2 flex items-center justify-between gap-2">
								<span className="text-xs text-sub-text truncate">
									{asset.name ?? "asset"}
								</span>
								<div className="flex items-center gap-1">
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => void handleToggleFavorite(asset)}
										className="h-8 w-8 text-sub-text hover:text-theme-primary"
										aria-label="즐겨찾기"
									>
										<Star
											size={14}
											className={asset.favorite ? "fill-current" : ""}
										/>
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => void handleDelete(asset)}
										className="h-8 w-8 text-sub-text hover:text-destructive"
										aria-label="에셋 삭제"
									>
										<Trash2 size={14} />
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</section>
	);
}
