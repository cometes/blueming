import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getDb } from "./admin";
import { normalizeGeneralData } from "./settings";
import type { SettingsSnapshot, FontRegistryItem } from "@/features/settings/types";

export type { FontRegistryItem };
export type ServerSettings = SettingsSnapshot;

// settings 컬렉션의 문서 목록. 새 설정 문서를 추가하면 여기도 갱신할 것.
// (컬렉션 스캔 + listCollections N+1 대신 getAll 1회 왕복으로 읽는다 —
//  실측상 서브컬렉션은 존재하지 않아 listCollections는 전부 헛왕복이었음)
export const SETTINGS_DOC_IDS = ["general", "main", "library", "gallery"] as const;

const fetchSettingsSnapshot = async (): Promise<ServerSettings> => {
	const db = getDb();
	const refs = SETTINGS_DOC_IDS.map((id) => db.collection("settings").doc(id));
	const snapshots = await db.getAll(...refs);
	const result = snapshots.reduce(
		(acc, snap) => {
			if (snap.exists) acc[snap.id] = snap.data();
			return acc;
		},
		{} as Record<string, unknown>
	);
	return {
		...result,
		general: normalizeGeneralData(result.general),
	} as ServerSettings;
};

// 주의: 이 함수는 실패 시 throw 해야 한다. unstable_cache 안에서 null을
// 반환하면 "실패"가 성공한 값으로 캐시되어(revalidate 전까지) 프리렌더에
// initialSettings:null이 박히는 사고가 났었다. throw된 호출은 캐시되지 않는다.
const _fetchServerSettings = unstable_cache(fetchSettingsSnapshot, ["server-settings"], {
	tags: ["settings"],
	// revalidateTag("settings")가 주 무효화 수단이고, 이 값은 빌드 시점
	// 실패(자격증명 부재 등)에서 런타임 자가 복구하는 안전망이다.
	revalidate: 300,
});

// React cache for within-request deduplication on top of Next.js Data Cache
export const getServerSettings = cache(
	async (): Promise<ServerSettings | null> => {
		try {
			return await _fetchServerSettings();
		} catch (error) {
			console.error("[settings] server settings fetch failed:", error);
			return null;
		}
	}
);
