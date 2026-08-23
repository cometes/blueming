import { httpClient } from "@/shared/lib/http/client";

export interface OrphanImage {
	path: string;
	size: number;
	updated: string | null;
}

export interface CleanupScanResult {
	scanned: number;
	referenced: number;
	recentSkipped: number;
	orphans: OrphanImage[];
	totalSize: number;
}

/** 고아 이미지 스캔 (dry-run) — 어떤 파일도 삭제하지 않는다 */
export const scanOrphanImages = async (): Promise<CleanupScanResult> => {
	const response = await httpClient.post<CleanupScanResult>(
		"/admin/cleanup-images",
		{ dryRun: true },
	);
	return response.data;
};

/** 스캔 결과로 받은 경로 목록을 삭제 */
export const deleteOrphanImages = async (
	paths: string[],
): Promise<{ deleted: number }> => {
	const response = await httpClient.post<{ deleted: number }>(
		"/admin/cleanup-images",
		{ dryRun: false, paths },
	);
	return response.data;
};
