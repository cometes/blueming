import {
	extractStoragePaths,
	storagePathFromUrl,
} from "@/app/api/_lib/imageRefs";

const BUCKET = "gray-and-blue";
const url = (path: string) =>
	`https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media`;

describe("storagePathFromUrl", () => {
	it("공개 URL에서 storagePath 복원 (인코딩·쿼리 처리)", () => {
		expect(storagePathFromUrl(url("library/create/images/123_a.png"), BUCKET)).toBe(
			"library/create/images/123_a.png",
		);
		expect(
			storagePathFromUrl(url("library/create/images/한글 파일.png"), BUCKET),
		).toBe("library/create/images/한글 파일.png");
	});

	it("다른 버킷/다른 호스트/비URL → null", () => {
		expect(storagePathFromUrl(url("x.png"), "other-bucket")).toBeNull();
		expect(
			storagePathFromUrl("https://example.com/v0/b/gray-and-blue/o/x.png", BUCKET),
		).toBeNull();
		expect(storagePathFromUrl("not a url", BUCKET)).toBeNull();
	});
});

describe("extractStoragePaths", () => {
	it("JSON 텍스트에서 자기 버킷 경로만 추출 + 중복 제거", () => {
		const a = url("library/create/images/1_a.png");
		const b = url("library/create/images/2_b.png");
		const other =
			"https://firebasestorage.googleapis.com/v0/b/other/o/x.png?alt=media";
		const text = JSON.stringify({
			content: [
				{ type: "image", attrs: { src: a } },
				{ type: "image", attrs: { src: b } },
				{ type: "image", attrs: { src: a } },
				{ type: "image", attrs: { src: other } },
			],
		});
		expect(extractStoragePaths(text, BUCKET).sort()).toEqual([
			"library/create/images/1_a.png",
			"library/create/images/2_b.png",
		]);
	});

	it("HTML 텍스트에서도 추출", () => {
		const a = url("library/create/images/3_c.png");
		const html = `<p>hi</p><img src="${a}" alt="c"><p>bye</p>`;
		expect(extractStoragePaths(html, BUCKET)).toEqual([
			"library/create/images/3_c.png",
		]);
	});

	it("URL이 없으면 빈 배열", () => {
		expect(extractStoragePaths("no urls here", BUCKET)).toEqual([]);
	});
});
