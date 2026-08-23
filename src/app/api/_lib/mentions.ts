import "server-only";
import { getDb } from "./admin";
import {
	emitNotification,
	type NotificationActor,
} from "./notifications";

export interface MentionEntry {
	uid: string;
	name: string;
}

/**
 * 멘션 알림 발송. 반환값은 알림을 받은 uid 목록 —
 * 소유자/관리자용 일반 알림에서 이들을 제외(exclude)해 중복 알림을 막는다
 * (같은 사건에 대해 멘션 알림이 우선).
 */
export const emitMentionNotifications = async ({
	actor,
	mentions,
	excerpt,
	link,
}: {
	actor: NotificationActor;
	mentions: MentionEntry[];
	excerpt: string;
	link: string;
}): Promise<string[]> => {
	if (mentions.length === 0) return [];
	const uids = mentions.map((m) => m.uid);
	await emitNotification({
		actor,
		recipients: uids,
		type: "mention",
		category: "mention",
		message: `${actor.name}님이 회원님을 언급했습니다`,
		excerpt,
		link,
	});
	return uids;
};

const MAX_MENTIONS = 10;

/**
 * 클라이언트가 보낸 mentions 배열을 검증·정규화한다.
 * - uid가 실제 active 회원인지 확인 (getUserDoc 수준의 직접 조회)
 * - 본문에 "@이름"이 실제로 포함돼 있는지 확인
 * - 중복 제거, 최대 10명. 불일치 항목은 조용히 드롭.
 */
export const validateMentions = async (
	raw: unknown,
	message: string,
): Promise<MentionEntry[]> => {
	if (!Array.isArray(raw) || raw.length === 0) return [];
	const db = getDb();
	const seen = new Set<string>();
	const result: MentionEntry[] = [];

	for (const entry of raw.slice(0, MAX_MENTIONS * 2)) {
		const record = entry as { uid?: unknown; name?: unknown };
		const uid = typeof record?.uid === "string" ? record.uid : "";
		const name = typeof record?.name === "string" ? record.name.trim() : "";
		if (!uid || !name || seen.has(uid)) continue;
		if (!message.includes(`@${name}`)) continue;

		const doc = await db.collection("users").doc(uid).get();
		const data = doc.exists ? doc.data() || {} : null;
		if (!data || data.status !== "active") continue;

		seen.add(uid);
		result.push({ uid, name });
		if (result.length >= MAX_MENTIONS) break;
	}

	return result;
};
