jest.mock("@/app/api/_lib/admin", () => ({ getDb: jest.fn() }));

import {
	decodeThreadCursor,
	encodeThreadCursor,
	normalizeVisibility,
	toThreadItem,
} from "@/app/api/_lib/thread";
import {
	extractFirstYouTubeVideoIdFromContent,
	extractYouTubeVideoId,
} from "@/shared/lib/youtube";

describe("스레드 커서", () => {
	it("encode → decode 왕복", () => {
		const cursor = { c: 1724500000000, id: "abc123" };
		expect(decodeThreadCursor(encodeThreadCursor(cursor))).toEqual(cursor);
	});

	it("변조/비정상 입력은 null (첫 페이지 처리)", () => {
		expect(decodeThreadCursor("not-base64!!")).toBeNull();
		expect(decodeThreadCursor("")).toBeNull();
		expect(decodeThreadCursor(null)).toBeNull();
		expect(
			decodeThreadCursor(Buffer.from('{"c":"x","id":1}').toString("base64url")),
		).toBeNull();
	});
});

describe("toThreadItem 잠금 스트리핑", () => {
	const makeDoc = (data: Record<string, unknown>) =>
		({
			id: "post1",
			data: () => data,
		}) as unknown as FirebaseFirestore.DocumentSnapshot;

	const memberPost = {
		content: "비밀 내용",
		author: { id: "u1", name: "작성자", avatarUrl: "" },
		authorId: "u1",
		mentions: [{ uid: "u2", name: "친구" }],
		imageUrls: ["https://a.com/x.png"],
		youtubeVideoId: "M78fivwmuDc",
		visibility: "member",
		tags: ["비밀"],
		replyCount: 3,
	};

	it("member 글 + 비회원 → 내용 스트리핑 + locked", () => {
		const item = toThreadItem(makeDoc(memberPost), { viewerIsMember: false });
		expect(item.locked).toBe(true);
		expect(item.content).toBeNull();
		expect(item.imageUrls).toEqual([]);
		expect(item.youtubeVideoId).toBeNull();
		expect(item.mentions).toEqual([]);
		expect(item.tags).toEqual([]);
		// 작성자·시간·카운트는 잠금 카드에 노출
		expect(item.author).toEqual(memberPost.author);
		expect(item.replyCount).toBe(3);
	});

	it("member 글 + 회원 → 전체 노출", () => {
		const item = toThreadItem(makeDoc(memberPost), { viewerIsMember: true });
		expect(item.locked).toBe(false);
		expect(item.content).toBe("비밀 내용");
		expect(item.imageUrls).toEqual(["https://a.com/x.png"]);
	});

	it("public 글은 비회원에게도 전체 노출", () => {
		const item = toThreadItem(
			makeDoc({ ...memberPost, visibility: "public" }),
			{ viewerIsMember: false },
		);
		expect(item.locked).toBe(false);
		expect(item.content).toBe("비밀 내용");
	});
});

describe("normalizeVisibility", () => {
	it("member만 인정, 그 외 public", () => {
		expect(normalizeVisibility("member")).toBe("member");
		expect(normalizeVisibility("secret")).toBe("public");
		expect(normalizeVisibility(undefined)).toBe("public");
	});
});

describe("유튜브 추출", () => {
	it("watch/youtu.be/shorts URL에서 videoId", () => {
		expect(
			extractYouTubeVideoId("https://www.youtube.com/watch?v=M78fivwmuDc"),
		).toBe("M78fivwmuDc");
		expect(extractYouTubeVideoId("https://youtu.be/M78fivwmuDc")).toBe(
			"M78fivwmuDc",
		);
	});

	it("본문에서 첫 유튜브 URL만 추출", () => {
		expect(
			extractFirstYouTubeVideoIdFromContent(
				"이 노래 좋다 https://example.com/x 그리고 https://youtu.be/M78fivwmuDc 끝",
			),
		).toBe("M78fivwmuDc");
		expect(extractFirstYouTubeVideoIdFromContent("유튜브 없음")).toBeNull();
	});
});
