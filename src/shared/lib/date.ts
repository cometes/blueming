export const dateConvert = (date: string) => {
	const _date = new Date(date);

	// 정확한 연월일 추출
	const yy = String(_date.getFullYear()).slice(-2); // 연도 뒤 두 자리
	const mm = String(_date.getMonth() + 1).padStart(2, "0"); // 월 (1월 = 0이므로 +1)
	const dd = String(_date.getDate()).padStart(2, "0"); // 일

	return `${yy} · ${mm} · ${dd}`;
};

export const dateTimeConvert = (date: string) => {
	const _date = new Date(date);

	const yy = String(_date.getFullYear()).slice(-2);
	const mm = String(_date.getMonth() + 1).padStart(2, "0");
	const dd = String(_date.getDate()).padStart(2, "0");
	const hh = String(_date.getHours()).padStart(2, "0");
	const min = String(_date.getMinutes()).padStart(2, "0");

	return `${yy} · ${mm} · ${dd} ${hh}:${min}`;
};

/**
 * 상대시간 표기 (트위터식): 방금 전 / N분 전 / N시간 전 / N일 전 / 그 이후 절대 날짜.
 * (NotificationPanel·PhotoboardItem의 사설 구현을 공용화한 것 — 신규 코드는 이걸 사용)
 */
export const formatRelativeTime = (iso: string | null | undefined): string => {
	if (!iso) return "";
	const time = new Date(iso).getTime();
	if (!Number.isFinite(time)) return "";
	const diffMs = Date.now() - time;
	const minutes = Math.floor(diffMs / 60_000);
	if (minutes < 1) return "방금 전";
	if (minutes < 60) return `${minutes}분 전`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}시간 전`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}일 전`;
	return new Date(iso).toLocaleDateString("ko-KR");
};
