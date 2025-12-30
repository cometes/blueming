export const dateConvert = (date: string) => {
	const _date = new Date(date);

	// 정확한 연월일 추출
	const yy = String(_date.getFullYear()).slice(-2); // 연도 뒤 두 자리
	const mm = String(_date.getMonth() + 1).padStart(2, "0"); // 월 (1월 = 0이므로 +1)
	const dd = String(_date.getDate()).padStart(2, "0"); // 일

	return `${yy} · ${mm} · ${dd}`;
};
