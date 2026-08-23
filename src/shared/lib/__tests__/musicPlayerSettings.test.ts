import { validateMusicPlayerSettings } from "@/app/api/_lib/settingsMain";

/** 객체 트리에 undefined 값이 하나라도 있으면 경로 반환 (Firestore가 거부함) */
const findUndefined = (value: unknown, path = ""): string | null => {
	if (value === undefined) return path || "(root)";
	if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i++) {
			const found = findUndefined(value[i], `${path}[${i}]`);
			if (found) return found;
		}
		return null;
	}
	if (typeof value === "object" && value !== null) {
		for (const [key, child] of Object.entries(value)) {
			const found = findUndefined(child, path ? `${path}.${key}` : key);
			if (found) return found;
		}
	}
	return null;
};

describe("validateMusicPlayerSettings", () => {
	it("videoId만 있는 곡: playlistId 등 없는 필드는 키 자체가 없어야 함 (Firestore undefined 거부)", () => {
		const result = validateMusicPlayerSettings({
			enabled: true,
			items: [
				{
					id: "a",
					title: "red",
					videoId: "M78fivwmuDc",
					thumbnail: "https://i.ytimg.com/vi/M78fivwmuDc/hqdefault.jpg",
					artist: "Hiroyuki SAWANO",
				},
			],
		});
		expect(result).not.toBeNull();
		expect(findUndefined(result)).toBeNull();
		expect(result?.items[0]).not.toHaveProperty("playlistId");
		expect(result?.items[0].videoId).toBe("M78fivwmuDc");
	});

	it("defaultItemId 미지정 시 키 부재", () => {
		const result = validateMusicPlayerSettings({
			enabled: false,
			items: [],
		});
		expect(result).not.toBeNull();
		expect(result).not.toHaveProperty("defaultItemId");
		expect(findUndefined(result)).toBeNull();
	});

	it("url만 있는 구 형식 입력도 id 역추출 저장", () => {
		const result = validateMusicPlayerSettings({
			enabled: true,
			items: [
				{
					id: "b",
					title: "곡",
					url: "https://www.youtube.com/watch?v=M78fivwmuDc",
				},
			],
		});
		expect(result?.items[0].videoId).toBe("M78fivwmuDc");
		expect(findUndefined(result)).toBeNull();
	});

	it("videoId·playlistId 둘 다 없으면 거부", () => {
		expect(
			validateMusicPlayerSettings({
				enabled: true,
				items: [{ id: "c", title: "x", url: "https://example.com" }],
			}),
		).toBeNull();
	});
});
