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
