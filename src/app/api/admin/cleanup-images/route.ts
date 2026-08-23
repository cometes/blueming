import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getBucket, getDb } from "@/app/api/_lib/admin";
import { requireAdmin } from "@/app/api/_lib/auth";
import {
	EDITOR_IMAGE_PREFIX,
	extractStoragePaths,
} from "@/app/api/_lib/imageRefs";

export const runtime = "nodejs";
// 콘텐츠가 많으면 스캔이 길어질 수 있음
export const maxDuration = 60;

/** 최근 업로드 유예 시간 — 작성 중인 글의 이미지를 고아로 오판하지 않기 위함 */
const RECENT_UPLOAD_GRACE_MS = 24 * 60 * 60 * 1000;

interface OrphanFile {
	path: string;
	size: number;
	updated: string | null;
}

/**
 * 사이트 전체에서 "참조 중인" 에디터 이미지 경로를 수집한다.
 * - 모든 library 문서 데이터(썸네일 등) + 본문 content.json
 * - settings 문서 4종 (프로필 자기소개·공지 본문 등 에디터 콘텐츠 포함)
 * URL 리터럴 정규식 스캔이라 저장 구조가 바뀌어도 동작한다.
 */
const collectReferencedPaths = async (): Promise<Set<string>> => {
	const db = getDb();
	const bucket = getBucket();
	const referenced = new Set<string>();
	const collect = (text: string) => {
		for (const path of extractStoragePaths(text, bucket.name)) {
			referenced.add(path);
		}
	};

	// 1) library 문서 메타데이터
	const librarySnapshot = await db.collection("library").get();
	for (const doc of librarySnapshot.docs) {
		collect(JSON.stringify(doc.data()));
	}

	// 2) library 본문 파일 전체 (contents/{id}/content.json)
	const [contentFiles] = await bucket.getFiles({
		prefix: "library/create/contents/",
	});
	await Promise.all(
		contentFiles.map(async (file) => {
			try {
				const [buffer] = await file.download();
				collect(buffer.toString("utf-8"));
			} catch (error) {
				console.warn(`cleanup: content read failed ${file.name}:`, error);
			}
		}),
	);

	// 3) settings 문서 (프로필·공지 등 에디터 콘텐츠가 들어가는 곳)
	const settingsSnapshot = await db.collection("settings").get();
	for (const doc of settingsSnapshot.docs) {
		collect(JSON.stringify(doc.data()));
	}

	return referenced;
};

export async function POST(req: NextRequest) {
	const auth = await requireAdmin();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const body = (await req.json().catch(() => ({}))) as {
			dryRun?: boolean;
			paths?: unknown;
		};
		const bucket = getBucket();

		// 삭제 실행: dry-run이 알려준 경로 목록을 명시적으로 받아서만 지운다
		if (body.dryRun === false) {
			const paths = Array.isArray(body.paths)
				? body.paths.filter(
						(p): p is string =>
							typeof p === "string" && p.startsWith(EDITOR_IMAGE_PREFIX),
					)
				: [];
			if (paths.length === 0) {
				return jsonError(400, "삭제할 경로 목록(paths)이 필요합니다.");
			}
			let deleted = 0;
			await Promise.all(
				paths.map(async (path) => {
					try {
						await bucket.file(path).delete({ ignoreNotFound: true });
						deleted += 1;
					} catch (error) {
						console.warn(`cleanup: delete failed ${path}:`, error);
					}
				}),
			);
			return jsonOk({ deleted });
		}

		// 스캔(dry-run): 고아 후보 목록 반환
		const [files] = await bucket.getFiles({ prefix: EDITOR_IMAGE_PREFIX });
		const referenced = await collectReferencedPaths();
		const now = Date.now();
		const orphans: OrphanFile[] = [];
		let recentSkipped = 0;

		for (const file of files) {
			if (referenced.has(file.name)) continue;
			const updated = file.metadata.updated ?? file.metadata.timeCreated ?? null;
			const updatedMs = updated ? new Date(String(updated)).getTime() : 0;
			// 작성 중 글 보호: 최근 24시간 내 업로드는 후보에서 제외
			if (now - updatedMs < RECENT_UPLOAD_GRACE_MS) {
				recentSkipped += 1;
				continue;
			}
			orphans.push({
				path: file.name,
				size: Number(file.metadata.size ?? 0),
				updated: updated ? String(updated) : null,
			});
		}

		orphans.sort((a, b) => b.size - a.size);
		const totalSize = orphans.reduce((acc, f) => acc + f.size, 0);

		return jsonOk({
			scanned: files.length,
			referenced: referenced.size,
			recentSkipped,
			orphans,
			totalSize,
		});
	} catch (error) {
		console.error("cleanup-images error:", error);
		return jsonError(500, "이미지 정리에 실패했습니다.");
	}
}
