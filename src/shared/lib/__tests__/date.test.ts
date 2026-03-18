import { dateConvert, dateTimeConvert } from "../date";

describe("dateConvert", () => {
	it("날짜 형식으로 변환 (YY · MM · DD)", () => {
		// 2024-01-15 기준 (로컬 시간 기준 파싱)
		const result = dateConvert("2024-01-15T00:00:00");
		expect(result).toMatch(/^\d{2} · \d{2} · \d{2}$/);
	});

	it("연도 뒤 두 자리만 사용", () => {
		const result = dateConvert("2024-06-01T00:00:00");
		expect(result.startsWith("24")).toBe(true);
	});

	it("월 두 자리 패딩", () => {
		const result = dateConvert("2024-01-15T00:00:00");
		// 1월 → "01"
		const parts = result.split(" · ");
		expect(parts[1]).toBe("01");
	});

	it("일 두 자리 패딩", () => {
		const result = dateConvert("2024-01-05T00:00:00");
		const parts = result.split(" · ");
		expect(parts[2]).toBe("05");
	});

	it("구분자 · 포함", () => {
		const result = dateConvert("2024-03-20T00:00:00");
		expect(result.includes(" · ")).toBe(true);
		expect(result.split(" · ").length).toBe(3);
	});
});

describe("dateTimeConvert", () => {
	it("날짜+시간 형식으로 변환", () => {
		const result = dateTimeConvert("2024-01-15T10:30:00");
		expect(result).toMatch(/^\d{2} · \d{2} · \d{2} \d{2}:\d{2}$/);
	});

	it("구분자 포함 및 시간 포함", () => {
		const result = dateTimeConvert("2024-03-20T14:05:00");
		expect(result.includes(":")).toBe(true);
	});

	it("분 두 자리 패딩", () => {
		// 포맷: "YY · MM · DD HH:MM" → 마지막 공백 뒤가 시간
		const result = dateTimeConvert("2024-03-20T14:05:00");
		const parts = result.split(" ");
		const timePart = parts[parts.length - 1]; // "14:05"
		expect(timePart).toBe("14:05");
	});
});
