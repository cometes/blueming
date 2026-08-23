import {
	clearImageDragSource,
	filenameFromUrl,
	imageDragSource,
	isHttpUrl,
	isImageUrl,
	isYoutubeUrl,
	loadImageSize,
	setImageDragSource,
} from "@/shared/lib/tiptapImage";

describe("isImageUrl", () => {
	it("이미지 확장자 URL → true", () => {
		expect(isImageUrl("https://a.com/x.png")).toBe(true);
		expect(isImageUrl("https://a.com/x.JPEG?v=1")).toBe(true);
		expect(isImageUrl("http://a.com/path/x.webp")).toBe(true);
	});

	it("이미지가 아니면 false", () => {
		expect(isImageUrl("https://a.com/x.pdf")).toBe(false);
		expect(isImageUrl("https://a.com/")).toBe(false);
		expect(isImageUrl("그냥 텍스트")).toBe(false);
	});
});

describe("isHttpUrl", () => {
	it("단일 http(s) 토큰 → true", () => {
		expect(isHttpUrl("https://a.com/x")).toBe(true);
		expect(isHttpUrl("  http://a.com  ")).toBe(true);
	});

	it("공백 포함/비http → false", () => {
		expect(isHttpUrl("https://a.com b")).toBe(false);
		expect(isHttpUrl("ftp://a.com")).toBe(false);
	});
});

describe("isYoutubeUrl", () => {
	it("유튜브 형태별 URL → true", () => {
		expect(isYoutubeUrl("https://www.youtube.com/watch?v=abc")).toBe(true);
		expect(isYoutubeUrl("https://youtu.be/abc")).toBe(true);
		expect(isYoutubeUrl("https://youtube.com/shorts/abc")).toBe(true);
	});

	it("일반 URL → false", () => {
		expect(isYoutubeUrl("https://vimeo.com/123")).toBe(false);
	});
});

describe("filenameFromUrl", () => {
	it("마지막 세그먼트에서 확장자를 뗀 이름", () => {
		expect(filenameFromUrl("https://a.com/dir/photo.png")).toBe("photo");
		expect(filenameFromUrl("https://a.com/dir/photo.png?v=2#top")).toBe("photo");
	});

	it("인코딩된 파일명 복원", () => {
		expect(filenameFromUrl("https://a.com/%ED%85%8C%EC%8A%A4%ED%8A%B8.png")).toBe(
			"테스트",
		);
	});

	it("이름을 알 수 없으면 '이미지'", () => {
		expect(filenameFromUrl("https://a.com/")).toBe("이미지");
	});
});

describe("imageDragSource 추적", () => {
	afterEach(() => clearImageDragSource());

	it("set/clear가 모듈 싱글턴을 갱신한다", () => {
		const fakeEditor = {};
		setImageDragSource(fakeEditor, 7);
		expect(imageDragSource.editor).toBe(fakeEditor);
		expect(imageDragSource.from).toBe(7);
		clearImageDragSource();
		expect(imageDragSource.editor).toBeNull();
		expect(imageDragSource.from).toBe(-1);
	});
});

describe("loadImageSize", () => {
	it("로드 실패(타임아웃) 시 { ok: false }", async () => {
		jest.useFakeTimers();
		// jsdom의 Image는 onload/onerror를 호출하지 않으므로 타임아웃 경로를 탄다
		const promise = loadImageSize("https://a.com/never.png");
		jest.advanceTimersByTime(5000);
		await expect(promise).resolves.toEqual({ ok: false });
		jest.useRealTimers();
	});

	it("로드 성공 시 natural width 반환", async () => {
		class FakeImage {
			onload: (() => void) | null = null;
			onerror: (() => void) | null = null;
			naturalWidth = 640;
			set src(_value: string) {
				queueMicrotask(() => this.onload?.());
			}
		}
		const original = globalThis.Image;
		globalThis.Image = FakeImage as unknown as typeof Image;
		try {
			await expect(loadImageSize("https://a.com/ok.png")).resolves.toEqual({
				ok: true,
				width: 640,
			});
		} finally {
			globalThis.Image = original;
		}
	});
});
