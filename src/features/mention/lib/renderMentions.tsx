import type { ReactNode } from "react";
import type { MentionEntry } from "@/features/mention/types";

/**
 * 본문 텍스트에서 멘션("@이름")을 하이라이트한 React 노드 배열을 만든다.
 * 문자열 조작 + React 엘리먼트만 사용 — dangerouslySetInnerHTML 미사용(XSS 안전).
 * mentions는 저장 시점의 이름 스냅샷 기준 (이름 변경 시 과거 글은 옛 이름으로 표시).
 */
export const renderContentWithMentions = (
	text: string,
	mentions: MentionEntry[] | null | undefined,
): ReactNode => {
	const names = (mentions ?? [])
		.map((m) => m.name)
		.filter(Boolean)
		// 긴 이름 우선 매칭 ("@김철수2"가 "@김철수"로 잘리지 않게)
		.sort((a, b) => b.length - a.length);
	if (names.length === 0 || !text) return text;

	const nodes: ReactNode[] = [];
	let remaining = text;
	let key = 0;

	while (remaining.length > 0) {
		let earliest = -1;
		let matchedName = "";
		for (const name of names) {
			const idx = remaining.indexOf(`@${name}`);
			if (idx !== -1 && (earliest === -1 || idx < earliest)) {
				earliest = idx;
				matchedName = name;
			}
		}
		if (earliest === -1) {
			nodes.push(remaining);
			break;
		}
		if (earliest > 0) {
			nodes.push(remaining.slice(0, earliest));
		}
		nodes.push(
			<span
				key={`mention-${key++}`}
				className="text-theme-primary font-medium"
			>
				@{matchedName}
			</span>,
		);
		remaining = remaining.slice(earliest + matchedName.length + 1);
	}

	return nodes;
};
