"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	deleteOrphanImages,
	scanOrphanImages,
	type CleanupScanResult,
} from "@/features/admin/api/cleanupImages";

const formatBytes = (bytes: number) => {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

/**
 * 본문 이미지 고아 파일 정리 (관리자 전용).
 * 스캔(dry-run) → 결과 확인 → 명시적 삭제의 2단계 — 스캔만으로는
 * 어떤 파일도 삭제되지 않으며, 최근 24시간 내 업로드는 후보에서 제외된다.
 */
export default function StorageCleanupSection() {
	const [scanning, setScanning] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [result, setResult] = useState<CleanupScanResult | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);

	const handleScan = async () => {
		try {
			setScanning(true);
			setResult(await scanOrphanImages());
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "스캔에 실패했습니다.",
			);
		} finally {
			setScanning(false);
		}
	};

	const handleDelete = async () => {
		if (!result || result.orphans.length === 0) return;
		try {
			setDeleting(true);
			const { deleted } = await deleteOrphanImages(
				result.orphans.map((o) => o.path),
			);
			toast.success(`고아 이미지 ${deleted}개를 삭제했습니다.`);
			setResult(null);
			setConfirmOpen(false);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "삭제에 실패했습니다.",
			);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<section className="space-y-4 mt-12">
			<div>
				<h2 className="text-[20px] font-semibold font-title">본문 이미지 정리</h2>
				<p className="text-sm text-sub-text mt-2">
					삭제된 글에 남은 본문 이미지(고아 파일)를 찾아 정리합니다. 스캔만으로는
					아무것도 삭제되지 않으며, 최근 24시간 내 업로드는 제외됩니다.
				</p>
			</div>

			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => void handleScan()}
					disabled={scanning || deleting}
					className="rounded-md border border-card bg-card-bg px-3 py-2 text-xs text-sub-text hover:border-card-active"
				>
					<Search className="h-4 w-4 mr-1" />
					{scanning ? "스캔 중..." : "고아 이미지 스캔"}
				</Button>
				{result && result.orphans.length > 0 && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setConfirmOpen(true)}
						disabled={deleting}
						className="rounded-md border border-card bg-card-bg px-3 py-2 text-xs text-sub-text hover:border-red-500 hover:text-red-500"
					>
						<Trash2 className="h-4 w-4 mr-1" />
						{result.orphans.length}개 삭제 ({formatBytes(result.totalSize)})
					</Button>
				)}
			</div>

			{result && (
				<div className="rounded-card border border-card bg-card-bg/60 p-3 text-xs text-sub-text space-y-2">
					<div>
						전체 {result.scanned}개 스캔 · 참조 중 {result.referenced}개 ·
						최근 업로드 제외 {result.recentSkipped}개 · 고아{" "}
						<span
							className={
								result.orphans.length > 0 ? "text-red-400 font-medium" : ""
							}
						>
							{result.orphans.length}개 ({formatBytes(result.totalSize)})
						</span>
					</div>
					{result.orphans.length > 0 && (
						<ul className="max-h-48 overflow-y-auto space-y-1 font-mono text-[11px]">
							{result.orphans.map((o) => (
								<li key={o.path} className="flex justify-between gap-2">
									<span className="truncate">
										{o.path.split("/").pop()}
									</span>
									<span className="shrink-0">{formatBytes(o.size)}</span>
								</li>
							))}
						</ul>
					)}
					{result.orphans.length === 0 && <div>정리할 고아 이미지가 없습니다.</div>}
				</div>
			)}

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent className="rounded-card border-card bg-card-bg backdrop-blur-sm">
					<DialogHeader>
						<DialogTitle>고아 이미지 삭제</DialogTitle>
						<DialogDescription>
							스캔된 고아 이미지 {result?.orphans.length ?? 0}개(
							{formatBytes(result?.totalSize ?? 0)})를 영구 삭제합니다. 이
							작업은 되돌릴 수 없습니다.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setConfirmOpen(false)}
							className="rounded-card border-card bg-card-bg"
						>
							취소
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={() => void handleDelete()}
							disabled={deleting}
							className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
						>
							{deleting ? "삭제 중..." : "삭제"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	);
}
